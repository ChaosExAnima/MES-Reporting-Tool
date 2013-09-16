var express = require('express'),
	stylus = require('stylus'),
	nib = require('nib'),
	app = express(),
	mongoose = require('mongoose')

function compile(str, path) {
	return stylus(str)
		.set('filename', path)
		.use(nib())
}

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(stylus.middleware({
	src: __dirname + '/public',
	compile: compile
}))
app.use(express.static(__dirname + '/public'))
app.use(express.bodyParser())

var log = console.log

function setupRoutes() {
	var form = require('express-form'),
		field = form.field,
		statics = require('./controllers/statics.js'),
		users = require('./controllers/users.js')

	form.configure({ autoTrim: true })

	app.get('/', statics.home)

	// User Pages
	app.get('/user/:id([A-Z]{2}\\d+)', users.userDetail)
	app.get('/user/add', users.userAdd)
	app.post('/user/add', 
		form(
			field('first').required().is(/^[a-z\.-\s]+$/i),
			field('last').required().is(/^[a-z\.-\s]+$/i),
			field('mes').required().is(/^[a-z]{2}\d{10}$/i).toUpper(),
			field('expiration').required().isDate()
		), 
		users.userSubmit
	)
	app.get('/user', users.userList)
}

// Connect to the DB
mongoose.connect('mongodb://localhost/prestige')
var db = mongoose.connection
db.on('error', console.error.bind(console, 'Connection error:'))
db.once('open', function callback () {
	log('Connected to DB.')

	// Bootstrap models
	var models_path = __dirname + '/models',
		fs = require('fs')
	fs.readdirSync(models_path).forEach(function (file) {
	  if (~file.indexOf('.js')) require(models_path + '/' + file)
	})

	// Initialize Routes
	setupRoutes()

	// Start app
	app.listen(3000)
	log('Starting up on port 3000.')
})