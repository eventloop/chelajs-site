var express = require('express'),
    swig = require('swig'),
    debug = require('debug')('chelajs:server'),
    util = require('util'),
    low = require('lowdb'),
    db = low('db.json', {storage: require('lowdb/file-sync')}),
    fs = require('fs'),
    cfg = require('./config.json');

var server = express();
var meethub = require('./lib/meethub')(cfg, db);

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

server.use('/meethub', meethub.handler);
require('./api')(server, db);

var port = process.env.PORT || 3000;
server.listen(port, function(){
  console.log("Listening on http://localhost:"+port);
});
console.log('Server booted at', new Date() );
