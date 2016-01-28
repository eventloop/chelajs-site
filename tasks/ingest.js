var grunt = require('grunt');
grunt.option('path');

grunt.registerTask('ingest', 'Ingesta manualmente un evento', function() {
  var Evento = require('../lib/evento'),
      low = require('lowdb'),
      db = low('db.json'),
      fs = require('fs'),
      cfg = require('../config.json'),
      Meethub = require('meethub');

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

grunt.registerTask('db:seed', 'Ingesta todos los eventos', function() {
  var cfg = require('../config.json'),
      request = require('request'),
      Meethub = require('meethub'),
      Evento = require('../lib/evento'),
      low = require('lowdb'),
      db = low('db.json', {
        storage: require('lowdb/file-sync')
      }),
      util = require('util')

  var mh = new Meethub(cfg, Evento);
  var done = this.async()
  var path = util.format('/repos/%s/contents/%s/', cfg.github.repo, cfg.github.folder)
  var BASE_URL = "https://api.github.com"+path
  // request.debug = true


  var create_request = function(url) {
    var req = {
      url: url,
      headers: {
        'User-Agent': 'Meethub'
      }
    }

    if (cfg.github.token) {
      req.headers.Authorization = 'token '+cfg.github.token
    }

    return req;
  }

  var handle_response = function(callback) {
    return function(err, res, body) {
      if (err) {
        console.error(err)
        process.exit(1)
      } else if (res.statusCode >= 400) {
        console.error("HTTP "+res.statusCode);
        console.error(body);
        process.exit(2)
      } else {
        callback(JSON.parse(body))
      }
    }
  }

  var fetch_event = function (event) {
    return new Promise(function(_res, _rej){
      request.get(create_request(event.url), handle_response(function(data){
        var contents = new Buffer(data.content, 'base64')
        var raw = Evento.unserialize(contents.toString('utf-8'))
        var evt = new Meethub.Event(raw)
        evt.props.source = event.url
        evt.props.starts = evt.starts.getTime()
        evt.props.ends = evt.ends.getTime()
        _res(evt.props)
      }))
    })
  }

  var on_events = function(events){
    console.log("Found "+events.length+" events")
    Promise
      .all(events.map(fetch_event))
      .then(function(all){
        console.log('Saving to database')
        all.sort(function(a, b){
          return a.starts - b.starts
        })
        all.forEach(function(i){
          // console.log(i.name+ " "+ (new Date(i.starts)))
          db('events').push(i)
        })
      })
  }


  console.log("Fetching "+BASE_URL)
  request.get(
    create_request(BASE_URL),
    handle_response(on_events)
  )

})
