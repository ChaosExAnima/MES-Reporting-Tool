'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
	compress = require('compression'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	morgan = require('morgan'),
	assetmanager = require('assetmanager'),
	config = require('./config');


/**
 * Sets up Express.
 */
module.exports = function(app, db) {
	app.set('showStackError', true);

	// Prettify HTML
	app.locals.pretty = true;

	// Compress response
	app.use(compress({
		level: 9
	}));

	// Only use logger for development environment
	if (process.env.NODE_ENV === 'development') {
		app.use(morgan({
			format: 'dev'
		}));
	}

	// Set up Jade
	app.set('views', config.root + '/app/views');
	app.set('view engine', 'jade');

	// Set up Stylus
	var stylus = require('stylus'),
		nib = require('nib');

	app.use(stylus.middleware({
		src: config.root + '/app',
		dest: config.root + '/public',
		compress: false,
		linenos: (process.env.NODE_ENV !== 'production'),
		compile: function(str, path) {
			return stylus(str)
				.set('filename', path)
				.use(nib())
				.import('nib');
		}
	}));
	app.use(bodyParser());

	// Enable jsonp
	app.enable('jsonp callback');

	// Request body parsing middleware should be above methodOverride
	app.use(methodOverride());

	// Import your asset file
	var assets = require('./assets.json');
	assetmanager.init({
		js: assets.js,
		css: assets.css,
		debug: (process.env.NODE_ENV !== 'production'),
		webroot: 'public'
	});

	// Add assets to local variables
	app.locals.assets = assetmanager.assets;

	// Set debug mode.
	app.locals.env = process.env.NODE_ENV;

	// Set config variables.
	app.locals.settings = require('./settings.json');

	// Set up navigation.
	app.locals.nav = [
		{
			name: "Home",
			path: "/"
		}
	];
	 
	// Sets up section names.
	app.use(function(req, res, next) {
		var chunks = req.path.split('/').slice(1),
			paths = [];

		if( chunks[0] === '' ) {
			chunks[0] = 'home';
		}

		paths.push(chunks[0]);

		if(chunks.length > 1) {
			paths.push( chunks.slice(0, -1).join('-') );
		}

		res.locals.section = paths;

		next();
	});

	// Enabled date formatting in templates.
	app.locals.dateformat = require('dateformat');

	// Bootstrap routes
	require('./routes')(app);

	// Setting the fav icon and static folder
	app.use(express.static(config.root + '/public'));

	// Assume "not found" in the error msgs is a 404. this is somewhat
	// silly, but valid, you can do whatever you like, set properties,
	// use instanceof etc.
	app.use(function(err, req, res, next) {
		// Treat as 404
		if (~err.message.indexOf('not found')) return next();

		// Log it
		console.error(err.stack);

		// Error page
		res.status(500).render('500', {
			error: err.stack,
			title: '500 Server Error! :('
		});
	});

	// Assume 404 since no middleware responded
	app.use(function(req, res) {
		res.status(404).render('404', {
			url: req.originalUrl,
			back: req.header('Referer'),
			error: 'Not found',
			title: '404 Not Found! :('
		});
	});
};