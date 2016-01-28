const EventEmitter = require('events'),
      _ = require('lodash'),
      util = require('util');

const setup = function(client) {
  return new RSVPDaemon(client);
};

const title_case = function (comps) {
  return comps.charAt(0).toLocaleUpperCase() + comps.slice(1).toLocaleLowerCase();
};

const name_components = function (nombre, tipo) {
  var comps = nombre.split(/\s+/);
  var fn = comps.length;
  if (fn <= 1) {
    return {
      first: nombre,
      last: ''
    };
  }

  comps = comps.map(title_case);
  var name_ends = Math.floor(fn/2);
  return {
    first: comps.slice(0, name_ends).join(' '),
    last: comps.slice(name_ends, comps.length+1).join(' ')
  };
};

const RSVPDaemon = function (client) {
  this.client = client;
  this.listeners = {};
  EventEmitter.call(this);
};

RSVPDaemon.parse = function parse_rsvp (source, defaults, hosts) {
  var mid = source.member.member_id;
  var data = defaults || {
    name: name_components(source.answers[0] || source.member.name),
    id: mid,
  };

  if (!data._role) {
    if (_.includes(hosts, mid)) {
      data._role = 'host';
    } else {
      data._role = 'guest';
    }
  }

  if (data._role === 'guest') {
    data.status = source.response;
    if (!data.override || data.override !== "name"){
      data.name = name_components(source.answers[0] || source.member.name);
    }
  }

  return data;
};

util.inherits(RSVPDaemon, EventEmitter);

RSVPDaemon.prototype.start = function start_listener (event) {
  var listener = {
    evt: event,
    watch: this.client.getStreamRSVPs({
      event_id: event.meetup_id
    })
  };
  var self = this;
  listener.l.on('data', function (obj) {
    self.emit('rsvp', {
      event: event,
      data: obj
    });

    if (new Date() > event.ends) {
      self.stop(obj.meetup_id);
    }
  });

  this.listeners[event] = listener;
};

RSVPDaemon.prototype.stop = function stop_listener (id) {
  var listener = this.listeners[id];

  try {
    listener.watch.abort();
  } catch (err) {
    self.emit('ended', err, listener.evt);
    return;
  }

  self.emit('ended', null, listener.evt);
};


module.exports = setup;
module.exports.parse = RSVPDaemon.parse;