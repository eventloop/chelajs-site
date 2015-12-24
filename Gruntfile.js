var title_case = function (comps) {
  return comps.charAt(0).toLocaleUpperCase() + comps.slice(1).toLocaleLowerCase();
};

var name_components = function (nombre, tipo) {
  var comps = nombre.split(/\s+/);
  var fn = comps.length;
  if (fn <= 1) {
    return {
      first: nombre,
      last: ''
    };
  }

  comps = comps.map(title_case);
  var name_ends = Math.floor(fn/2);
  return {
    first: comps.slice(0, name_ends).join(' '),
    last: comps.slice(name_ends, comps.length+1).join(' ')
  };
};

var rpad = function (str) {
  str = str.toString();
  if (str.length < 2) {
    str = "0"+str;
  }
  return str;
};

module.exports = function(grunt) {
  grunt.initConfig({
    stylus: {
      dev: {
        files: {
          'public/css/main.css': 'public/stylus/main.styl',
          'public/css/admin.css': 'public/stylus/admin.styl',
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      stylus: {
        files: ['public/stylus/**/*.styl'],
        tasks: ['stylus:dev']
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('styles', ['stylus:dev', 'watch']);

  grunt.option('path');
  grunt.registerTask('ingest', 'Ingesta manualmente un evento', function() {
    var Evento = require('./lib/evento'),
        low = require('lowdb'),
        db = low('db.json'),
        fs = require('fs'),
        Meethub = require('meethub');
        var cfg = JSON.parse(fs.readFileSync('config.json'));
        var mh = new Meethub(cfg, Evento);

        var path = grunt.option('path');
        var data = fs.readFileSync(path, 'utf8');
        var raw = Evento.unserialize(data);
        var evt = new Meethub.Event(raw);

        evt.props.source = path;
        evt.props.starts = evt.starts.getTime();
        evt.props.ends = evt.ends.getTime();

        db('events').push(evt.props);
        db.saveSync('db.json');
  });

  grunt.registerTask('meetup:rsvp:print', 'genera la versión imprimible de lista de asistentes', function (){
    var Evento = require('./lib/evento'),
        fs = require('fs'),
        low = require('lowdb'),
        db = low('db.json'),
        _ = require('lodash'),
        swig = require('swig'),
        Meethub = require('meethub');

    var cfg = JSON.parse(fs.readFileSync('config.json'));
    var mh = new Meethub(cfg, Evento);

    var last = db('events')
      .chain()
      .sortBy('starts')
      .reverse()
      .take(1)
      .value()[0];

    var base = "./tmp/"+last.meetup_id+"-rsvp.";
    var data = JSON.parse(fs.readFileSync(base+'json'));
    var people = _.sortByAll(data.people, ['_role', 'name.last', 'name.first']);
    var date = new Date(data.starts);
    var starts = [date.getFullYear(), date.getMonth(), date.getDay()].map(rpad).join('-');
    var guests = _.filter(people, function (g) { return g.override !== "hidden" && g._role === "guest"; });

    var opts = {
      name: data.name,
      date: starts,
      guests: _.groupBy(_.filter(guests, {status: "yes"}), function (p) {
        return p.name.last.charAt(0).toLocaleUpperCase();
      }),
      waitlist: _.filter(guests, {status: "waitlist"}),
      hosts: _.filter(people, {_role: 'host'}),
      speakers: _.filter(people, {_role: 'speaker'}),
      fellows: _.filter(people, {_role: 'fellow'})
    };


    var done = this.async();
    fs.writeFile(base+'html', swig.renderFile('./views/guestlist.html', opts), function (err) {
      if (err) throw err;
      console.log('file://'+fs.realpathSync(base+'html'));
      done();
    });
  });

  grunt.registerTask('meetup:rsvp:fetch', 'descarga la lista de asistentes', function () {
    // console.log(name_components("rob hidalgo"))
    var Evento = require('./lib/evento'),
        fs = require('fs'),
        low = require('lowdb'),
        db = low('db.json'),
        _ = require('lodash'),
        Meethub = require('meethub'),
        cache;

    var cfg = JSON.parse(fs.readFileSync('config.json'));
    var mh = new Meethub(cfg, Evento);

    var event = Evento.decorate(
      db('events')
      .chain()
      .sortBy('starts')
      .reverse()
      .take(1)
      .value()[0]);

    console.log('Obteniendo meetup#'+event.meetup_id);

    var cache_path = "./tmp/"+event.meetup_id+"-rsvp.json";
    try {
      cache = JSON.parse(
        fs.readFileSync(cache_path)
      );
      cache.starts = new Date(cache.starts);
    } catch (err) {
      cache = {
        id: event.meetup_id,
        name: event.name,
        starts: event.starts,//.toISOString(),
        people: []
      };
    }

    var hosts = _.filter(cache.people, {_role: 'host'});
    hosts = (hosts.length > 0) ? _.pluck(hosts, 'id') : cfg.meetup.defaults.hosts;
    var speakers = _.pluck(speakers, _.filter(cache.people, {_role: 'speaker'}), 'id');
    cache.people = _.indexBy(cache.people, 'id');

    var done = this.async();
    mh.meetup.getRSVPs({event_id: event.meetup_id.toString()}, function(err, res) {
    // fs.readFile('./_data.json', function(err, res){
    //   res = JSON.parse(res);
      var finals = [];
      res.results.forEach(function (a) {
        var mid = a.member.member_id;
        if (a.status == 'no') {
          delete cache[mid];
          return true;
        }

        var data = cache.people[mid] || {
          name: name_components(a.answers[0] || a.member.name),
          id: mid,
        };

        if (!data._role) {
          if (_.includes(hosts, mid)) {
            data._role = 'host';
          } else {
            data._role = 'guest';
            data.status = a.response;
            data.name = name_components(a.answers[0] || a.member.name);
          }
        }

        cache.people[mid] = data;
      });

      cache.people = _.sortByAll(_.values(cache.people), ['_role', 'name.last', 'name.first']);

      fs.writeFile(cache_path, JSON.stringify(cache), 'utf-8', function (err) {
        if (err) throw err;
        console.log('Archivo guardado en '+path);
        done();
      });
    });
  });

  grunt.registerTask('meetup:html', 'crea HTML para meetup', function () {
    var Evento = require('./lib/evento'),
        fs = require('fs'),
        Meethub = require('meethub');
        var cfg = JSON.parse(fs.readFileSync('config.json'));
        var mh = new Meethub(cfg, Evento);

        var path = grunt.option('path');
        var data = fs.readFileSync(path, 'utf8');
        var raw = Evento.unserialize(data);
        var evt = new Meethub.Event(raw);

        // grunt sin --silent es una mamada
        process.stderr.write(Evento.description(evt));
  });
};