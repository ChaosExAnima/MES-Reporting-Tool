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

function init() {
	var func = require('./functions.js'),
		form = require('express-form')
		field = form.field

	form.configure({ autoTrim: true })

	app.get('/', func.home)

	// User Pages
	// app.get('/user/:id', func.userDetail)
	app.get('/user/add', func.userAdd)
	app.post('/user/add', 
		form(
			field('first').required().is(/^[a-z\.-\s]+$/i),
			field('last').required().is(/^[a-z\.-\s]+$/i),
			field('mes').required().is(/^[a-z]{2}\d{10}$/i).toUpper(),
			field('expiration').required().isDate()
		), 
		func.userSubmit
	)
	app.get('/user', func.userList)

	// Start app
	app.listen(3000)
	log('Starting up on port 3000.')
}

// Connect to the DB
mongoose.connect('mongodb://localhost/prestige')
var db = mongoose.connection
db.on('error', console.error.bind(console, 'Connection error:'))
db.once('open', function callback () {
	log('Connected to DB.')
	init()
})