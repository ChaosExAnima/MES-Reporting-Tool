var nav = {
	Home: '/',
	Users: '/user',
}

exports.home = function(req, res) {
	res.render('home', {title: 'Home', nav: nav, cururl: '/'})
}

exports.userList = function(req, res) {
	var users = [
		{
			id: 0,
			last: 'Gregor',
			first: 'Ephraim',
			mes: 'US2012030038',
			expire: new Date('10/01/2013')
		},
		{
			id: 1,
			last: 'Hardwick',
			first: 'Senia',
			mes: 'US2012030038',
			expire: new Date('01/01/2013')
		}
	]

	var dateFormat = require('dateformat')

	for(user in users) {
		users[user].expire = dateFormat( user.expire, 'mm/yyyy' )
	}

	res.render('user', {title: 'Users', nav: nav, cururl: '/user', users: users })
}

exports.userAdd = function(req, res) {}

exports.userDetail = function(req, res) {}