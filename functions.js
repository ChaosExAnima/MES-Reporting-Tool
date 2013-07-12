var nav = {
	Home: '/',
	Users: '/user',
},
	log = console.log

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

exports.userAdd = function(req, res) {
	var fields = {
		first: ['', false],
		last: ['', false],
		mes: ['', false],
		expiration: ['', false]
	}

	var form = req.form,
		err = function(field) {
			return form.getErrors(field).length ? 'error' : '';
		}

	if(typeof form != 'undefined') {
		fields = {
			first: [form.first, err('first')],
			last: [form.last, err('last')],
			mes: [form.mes, err('mes')],
			expiration: [form.expiration, err('expiration')]
		}
	}

	res.render('user_add', {title: 'Add User', nav: nav, cururl: '/user', fields: fields})
}

exports.userSubmit = function(req, res) {
	if(!req.form.isValid) {
		exports.userAdd(req, res)
	} else {
		// Add validated user to DB.

		// Redirect back to user list.
		res.redirect('/user')
	}
}

exports.userDetail = function(req, res) {}