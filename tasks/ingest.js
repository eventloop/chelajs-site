var grunt = require('grunt');
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