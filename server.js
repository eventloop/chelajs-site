var express = require('express'),
    swig = require('swig'),
    morgan = require('morgan'),
    Evento = require('./lib/evento'),
    util = require('util'),
    low = require('lowdb'),
    fs = require('fs'),
    db = low('db.json'),
    Meethub = require('meethub');

var server = express();
var cfg = JSON.parse(fs.readFileSync('config.json'));


var mh = new Meethub(cfg, Evento);
var rsvp_daemon = require('./lib/rsvp_daemon')(mh.meetup);

// View engine
swig.setDefaults({
  root: './views',
  cache : false
});


server.engine('html', swig.renderFile);
server.set('view engine', 'html');
server.set('views', __dirname + '/views');
server.set('view cache', true);

server.use(express.static('./public'));
var logger = morgan('combined');
server.use( morgan('combined') );

server.use('/meethub', mh.handler);


mh.on('created', function(event){
  var e = event.props;
  e.source = e.url();
  db('events').push(e);
  db.saveSync('db.json');
  rsvp_daemon.start(event);
});

mh.on('updated', function(event){
  var url = event.url();
  db('events')
    .chain()
    .find({source: event.url()})
    .assign(event.props);
});

rsvp_daemon.on('rsvp', function rsvp (data) {
  var record = db('rsvp')
    .chain()
    .find({id: data.event.meetup_id});
  var defaults = record.value();
  record.assign(RSVPDaemon.parse(data, defaults));
});

rsvp_daemon.on('ended', function event_ended (err, evt) {
  var people = db('rsvp')
    .chain()
    .find({id: evt.meetup_id});

  var stats = {
    went: people.find({"status": "yes"})
  };
});



server.get('/', function (req, res) {

  var now = new Date();
  var event = Evento.decorate(
    db('events')
    .chain()
    .sortBy('starts')
    .reverse()
    .take(1)
    .value()[0]);

  res.render('home',{
    home  : true,
    upcoming: now < event.ends,
    main_event: event
  });
});

server.get('/events', function (req, res) {
  res.json(db('events').chain()
    .sortBy('starts')
    .reverse()
    .take(5)
    .value().map(Evento.decorate));
});


var port = process.env.PORT || 3000;
server.listen(port, function(){
  console.log("Listening on http://localhost:"+port);
});
console.log('Server booted at', new Date() );