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
        util = require('util'),
        low = require('lowdb'),
        db = low('db.json'),
        fs = require('fs'),
        Meethub = require('meethub');
        var cfg = JSON.parse(fs.readFileSync('config.json'));
        var mh = new Meethub(cfg, Evento);

        var path = grunt.option('path');
        var data = fs.readFileSync(path, 'utf8');
        var evt = new Meethub.Event(Evento.unserialize(data));
        evt.props.source = path;
        db('events').push(evt.props);
        db.saveSync('db.json');
  });
}