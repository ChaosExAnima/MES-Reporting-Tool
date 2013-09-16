config = require('./config.js')

exports.home = function(req, res) {
	res.render('home', {title: 'Home', nav: config.nav, cururl: '/'})
}