var grunt = require('grunt')

grunt.registerTask(
  'meetup:description',
  'crea HTML para meetup',
  function () {
  var Evento = require('./lib/evento'),
      fs = require('fs'),
      Meethub = require('meethub')
  var cfg = JSON.parse(fs.readFileSync('config.json'))
  var mh = new Meethub(cfg, Evento)

  var path = grunt.option('path')
  var data = fs.readFileSync(path, 'utf8')
  var raw = Evento.unserialize(data)
  var evt = new Meethub.Event(raw)

  // grunt sin --silent es una mamada
  process.stderr.write(Evento.description(evt))
})
