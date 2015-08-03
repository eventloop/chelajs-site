var express = require('express.io'),
	swig = require('swig');

var server = express();

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

server.use(express.logger());

server.get('/', function (req, res) {
	res.render('home',{
		home  : true,
	});	
});

server.listen(process.env.PORT || 3000);
console.log('Server booted at', new Date() );