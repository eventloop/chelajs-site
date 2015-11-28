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
  })
  grunt.loadNpmTasks('grunt-contrib-stylus')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('styles', ['stylus:dev', 'watch'])

  grunt.option('path');
  grunt.registerTask('ingest', 'Ingesta manualmente un evento', function(){
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
}