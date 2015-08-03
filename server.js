var express = require('express'),
	swig = require('swig'),
	morgan = require('morgan');

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

var logger = morgan('combined')
server.use( morgan('combined') )

server.get('/', function (req, res) {
	res.render('home',{
		home  : true,
	});	
});

server.listen(process.env.PORT || 3000);
console.log('Server booted at', new Date() );