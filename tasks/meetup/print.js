var grunt = require('grunt');
var rpad = function (str) {
  str = str.toString();
  if (str.length < 2) {
    str = "0"+str;
  }
  return str;
};

grunt.registerTask(
  'meetup:rsvp:print',
  'genera la versión imprimible de lista de asistentes',
  function PrintGuestlist () {
    var Evento = require('../../lib/evento'),
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
    var starts = [date.getFullYear(), date.getMonth(), date.getDate()].map(rpad).join('-');
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
      fellows: _.filter(people, {_role: 'fellow'}),
      total: _.filter(guests, {status: "yes"}).length
    };


    var done = this.async();
    fs.writeFile(base+'html', swig.renderFile('./views/guestlist.html', opts), function (err) {
      if (err) throw err;
      grunt.log.writeln('file://'+fs.realpathSync(base+'html'));
      done();
    });
  }
);