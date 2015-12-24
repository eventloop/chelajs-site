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
server.use('/meethub', mh.handler);


mh.on('created', function(event){
  var e = event.props;
  e.source = e.url();
  db('events').push(e);
  db.saveSync('db.json');
});

mh.on('updated', function(event){
  var url = event.url();
  db('events')
    .chain()
    .find({source: event.url()})
    .assign(event.props);
});

var logger = morgan('combined');
server.use( morgan('combined') );

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