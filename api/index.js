var Evento = require('../lib/evento')

module.exports = function (server, db) {
  server.get('/', function (req, res) {
    var now = new Date()
    var event = Evento.decorate(
      db('events')
      .chain()
      .sortBy('starts')
      .reverse()
      .take(1)
      .value()[0])

    res.render('home',{
      home  : true,
      upcoming: now < event.ends,
      main_event: event
    })
  })

  server.get('/events', function (req, res) {
    res.json(db('events').chain()
      .sortBy('starts')
      .reverse()
      .take(5)
      .value().map(Evento.decorate))
  })
}
