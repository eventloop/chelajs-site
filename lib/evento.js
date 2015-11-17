var yaml = require('js-yaml'),
    marked = require('marked'),
    util = require('util'),
    Meethub = require('meethub');

var Markup = function (string) {
  this.klass = 'Markup';
  this.html = marked(string);
  this.md = string;
};

var MarkupType = new yaml.Type('!markdown', {
  kind: 'scalar',
  resolve: function (data) {
    return data !== null;
  },
  construct: function (string) {
    return new Markup(string);
  },
  instanceOf: Markup,
  represent: function (markup) {
    return markup.markdown;
  }
});

var MARKUP_SCHEMA = yaml.Schema.create([MarkupType]);
var yaml_opts = {schema: MARKUP_SCHEMA};

var meses = 'ene feb mar abr may jun jul oct sep oct nov dic'.split(' ');
var str_date = function (time) {
  return fecha = [('0'+ time.getDay()).slice(-2), meses[time.getMonth()]].join('/');
}

var str_time = function (time) {
  return [time.getHours(), time.getMinutes()].join(':');
};

var ChelaJS = {
  decorate: function (evt) {
    var time = typeof evt.starts === 'string' ? new Date(evt.starts) : evt.starts;
    evt.string_date = str_date(time);
    evt.string_time = str_time(time);
    return evt;
  },
  unserialize: function (string) {
    var d = yaml.load(string, yaml_opts);
    return d;
  },
  serialize: function (evt) {
    return yaml.dump(evt.props, yaml_opts);
  },
  description: function (evt) {
    var comps = [
      evt.intro.html,
      '<p>---</p>',
      evt.talks.map(function (talk) {
        return marked(["",
          "**> "+talk.title+"**",
          talk.summary,
          "["+talk.speaker.name+"]("+talk.speaker.url+") | "+talk.speaker.bio
        ].join("\n\n"));
      }).join("\n<p></p>\n"),
      '<p>---</p>',
      evt.footer.html
    ];
    return comps.join("\n<p></p>\n");
  }
};

module.exports = ChelaJS;