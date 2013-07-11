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

function init() {
	var func = require('./functions.js')

	app.get('/', func.home)

	// User Pages
	app.get('/user', func.userList)
	app.get('/user/:id', func.userDetail)
	app.get('/user/add', func.userAdd)

	// Start app
	app.listen(3000)
	console.log('Starting up on port 3000.')
}

// Connect to the DB
mongoose.connect('mongodb://localhost/prestige')
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function callback () {
	console.log('success!')
	init()
})