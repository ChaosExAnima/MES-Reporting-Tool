var express = require('express'),
	mongoose = require('mongoose'),
	util = require('util');

// Sets globals.
app = express();
config = require('./config.json');
log = function(str) { util.log( util.inspect(str) ); };

// Sets up logger.
app.use(express.logger('dev'));

log('Initializing middleware.');

// Sets up views and initialized Jade.
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Sets up Stylus.
var stylus = require('stylus'),
	nib = require('nib');

app.use(stylus.middleware({
	src: __dirname + '/public',
	compile: function(str, path) {
		return stylus(str)
			.set('filename', path)
			.use(nib());
	}
}));
app.use(express.bodyParser());

// Sets up Coffeescript.
var coffeescript = require('connect-coffee-script');

app.use(coffeescript({
  	src: __dirname + '/public',
  	bare: true
}));

// Sets static directory.
app.use(express.static(__dirname + '/public'));

// Connect to the DB
mongoose.connect('mongodb://localhost/prestige');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function callback () {
	log('Connected to DB.');

	// Bootstrap models
	var models_path = __dirname + '/models',
		fs = require('fs');
	fs.readdirSync(models_path).forEach(function (file) {
	  	if (~file.indexOf('.js')) require(models_path + '/' + file);
	});

	// Initialize Routes
	setupRoutes();

	// Start app
	app.listen(3000);
	log('Starting up on port 3000.');
});

function setupRoutes() {
	var statics = require('./controllers/statics.js'),
		users = require('./controllers/users.js'),
		reports = require('./controllers/reports.js'),
		prestige = require('./controllers/prestige.js');

	log('Configuring routes.');

	// Set up basic template variables.
	app.locals({
		nav: config.nav
	});

	app.use(function(req, res, next) {
		app.locals.cururl = req.url.match(/^(\/[a-z]*)/)[0];
		
		var chunks = req.url.split('/').slice(1);
		if(chunks.length > 1) {
			chunks = chunks.slice(0, -1);
		}
		app.locals.section = "section-"+chunks.join('-');

		app.locals.flash = false;
		next();
	});

	// Static pages.
	app.get('/', statics.home);

	// User Pages
	app = users.route(app, '/user');

	// Reports pages
	app = reports.route(app, '/report');

	// Prestige pages
	app = prestige.route(app, '/prestige');
};

// Sets a global function.
setFlash = function(message, type) {
	if(!type) {
		type = "notification";
	}

	app.locals.flash = {
		type: type,
		text: message
	};
};