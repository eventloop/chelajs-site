var Meethub = require('meethub'),
    Evento = require('../evento'),
    debug = require('debug')('chelajs:meethub')

module.exports = function(cfg, db) {
  var mh = new Meethub(cfg, Evento)
  var rsvp_daemon = require('../rsvp_daemon')(mh.meetup)

  mh.on('created', function(event){
    var e = event.props
    e.source = e.url()
    debug("«"+e.name+"» published at "+e.source)

    db('events').push(e)
    db.saveSync('db.json')
    rsvp_daemon.start(event)
  })

  mh.on('updated', function(event){
    var url = event.url()
    debug("«"+e.name+"» updated")
    db('events')
      .chain()
      .find({source: event.url()})
      .assign(event.props)
  })

  rsvp_daemon.on('rsvp', function rsvp (data) {
    var record = db('rsvp')
      .chain()
      .find({id: data.event.meetup_id})
    var defaults = record.value()
    record.assign(rsvp_daemon.parse(data, defaults))
  })

  rsvp_daemon.on('ended', function event_ended (err, evt) {
    var people = db('rsvp')
      .chain()
      .find({id: evt.meetup_id})

    var stats = {
      went: people.find({"status": "yes"})
    }
  })

  return mh
}
