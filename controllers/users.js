var dateformat = require('dateformat'),
	mongoose = require('mongoose'),
	async = require('async'),
	underscore = require('underscore'),
	User = mongoose.model('User'),
	Prestige = mongoose.model('Prestige');

/**
 * Routing
 */
exports.route = function(app, path) {
	var form = require('express-form'),
		field = form.field;

	form.configure({ autoTrim: true });

	var validation = form(
		field('first').required().is(/^[a-z\.-\s]+$/i),
		field('last').required().is(/^[a-z\.-\s]+$/i),
		field('email').isEmail(),
		field('mes').required().is(/^[a-z]{2}\d{10}$/i).toUpper(),
		field('expiration').required().isDate(),
		field('trial').toBoolean(),
		field('mc').isInt(),
		field('g').isInt(),
		field('r').isInt(),
		field('n').isInt(),
		field('standard').array()
	);

	app.get(path+'/add', this.add)
	app.post(path+'/add', validation, this.submit)

	app.get(path+'/search/', this.search)

	app.get(path+'/edit/:id([A-Z]{2}\\d+)', this.edit)
	app.post(path+'/edit/:id([A-Z]{2}\\d+)', validation, this.submit)

	app.get(path+'/:id([A-Z]{2}\\d+)', this.detail)
	app.get(path+'/delete/:id([A-Z]{2}\\d+)', this.delete)

	app.get(path, this.index)

	return app;
}


/**
 * Lists users.
 */
exports.index = function(req, res) {
	var now = new Date().getTime(),
		sort = { 'name.last': 1 };

	if(req.query.sort == 'date') {
		sort = { 'expire': 1 };
	} else if(req.query.sort == 'mc') {
		sort = { 'prestige.mc': -1 };
	}
	
	User.find({}, null, { sort: sort }, function(err, users) {
		for (var i = 0; i < users.length; i++) {
			users[i] = users[i].toObject();
			users[i].is_expired = users[i].expire <= new Date().getTime();
			users[i].expire = dateformat(users[i].expire, "yyyy-mm-dd");
		};
		res.render('users/index', {title: 'Users', users: users, sort: Object.keys(sort)[0] })
	});	
}

/**
 * Show user detail
 */
exports.detail = function(req, res) {
	var id = req.params.id

	if(id) {
		var user, awards;

		async.series([
			// Get the user data.
			function(callback) {
				User
				.findByMes(id)
				.exec(function(err, data) {
					user = data.toObject();
					user.is_expired = user.expire <= new Date().getTime();
					callback(err);
				});
			},

			// Get the prestige data.
			function(callback) {
				Prestige
				.findByUser(user._id)
				.sort('date')
				.exec(function(err, data) {
					awards = data;
					callback(err);
				});
			}
		], function(err) {
			if(err) {
				log(err);
				return;
			}

			var title = 'User Detail: ' + user.name.last + ', ' + user.name.first;

			res.render('users/detail', { title: title, user: user, awards: awards, dateformat: dateformat });
		});
	} else {
		res.redirect('/user')
	}
}

/**
 * Adds a user
 */
exports.add = function(req, res) {
	var fields = {
		first: ['', false],
		last: ['', false],
		email: ['', false],
		mes: ['', false],
		expiration: ['', false],
		trial: ['', false],
		mc: [1, false],
		g: [0, false],
		r: [0, false],
		n: [0, false],
		standards: {}
	};

	config.standards.forEach(function(item) {
		fields.standards[item] = [false, item];
	});

	var form = req.form,
		err = function(field) {
			return form.getErrors(field).length ? 'error' : '';
		}

	if(typeof form != 'undefined') {
		fields = {
			first: [form.first, err('first')],
			last: [form.last, err('last')],
			email: [form.email, err('email')],
			mes: [form.mes, err('mes')],
			expiration: [form.expiration, err('expiration')],
			trial: [form.trial, err('trial')],
			mc: [form.mc, err('mc')],
			g: [form.g, err('g')],
			r: [form.r, err('r')],
			n: [form.n, err('n')],	
		}
	}

	res.render('users/add', {title: 'Add User', fields: fields})
}


exports.edit = function(req, res) {
	var id = req.params.id;

	if(!id) {
		res.redirect('/user');
		return;
	}

	User.findOne({ mes: id }, function(err, user) {
		var fields = {
			first: [user.name.first, false],
			last: [user.name.last, false],
			email: [user.email, false],
			mes: [user.mes, false],
			expiration: [dateformat(user.expire, 'yyyy-mm-dd'), false],
			trial: [user.trial, false],
			mc: [user.prestige.mc, false],
			g: [user.prestige.g, false],
			r: [user.prestige.r, false],
			n: [user.prestige.n, false],
			standards: {},
		}

		config.standards.forEach(function(item) {
			fields.standards[item] = [false, item];
		});

		user.standards.forEach(function(item) {
			fields.standards[item.name][0] = true;
		});

		var form = req.form,
			err = function(field) {
				return form.getErrors(field).length ? 'error' : '';
			}

		if(typeof form != 'undefined') {
			fields = {
				first: [form.first, err('first')],
				last: [form.last, err('last')],
				email: [form.email, err('email')],
				mes: [form.mes, err('mes')],
				expiration: [form.expiration, err('expiration')],
				trial: [form.trial, err('trial')],
				mc: [form.mc, err('mc')],
				g: [form.g, err('g')],
				r: [form.r, err('r')],
				n: [form.n, err('n')],	
				standards: {},			
			}

			config.standards.forEach(function(item) {
				var slug = item.replace(/(\W)/g, "-").toLowerCase();
				fields.standards[item] = [false, item];
			});

			form.standard.forEach(function(item) {
				fields.standards[item][0] = true;
			});
		}

		if(fields.email[0] === 'false') {
			fields.email[0] = '';
		}

		res.render('users/edit', {title: 'Edit User '+user.name.last+', '+user.name.first, fields: fields, mes: user.mes})
	});
}


/**
 * Deletes a user.
 */
exports.delete = function(req, res) {
	var id = req.params.id

	if(id) {
		User.remove({ mes: id }, function(err, doc) {
			res.redirect('/user');
		});
	} else {
		res.redirect('/user');
	}
}


/**
 * Submits a user.
 */
exports.submit = function(req, res) {
	var id = req.params.id

	if(!req.form.isValid) {
		if(id) {
			exports.edit(req, res);
		} else {
			exports.add(req, res);
		}
	} else {
		var form = req.form;

		// Add/update user.
		var user = {
			name: {
				first: form.first,
				last: form.last
			},
			email: form.email,
			mes: form.mes,
			expire: Date.parse(form.expiration) + 18000000, // Add a day due to stupid time differences.
			trial: form.trial,
			prestige: {
			    mc: Math.max( parseInt(form.mc), 1),
			    g: parseInt(form.g),
			    r: parseInt(form.r),
			    n: parseInt(form.n),
			    gt: parseInt(form.g) + parseInt(form.r) + parseInt(form.n),    
			},
			standards: form.standard,
			disciplinaryactions: [],
		};

		User.update({ mes: id }, user, { upsert: true }, function(err) {
			if(id) {
				res.redirect('/user/'+id);
			} else {
				res.redirect('/user');
			}
		});
	}
}


/**
 * Interface for autocompletion based on user name.
 */
exports.search = function(req, res) {
	var query = req.query.term;

	if(!query || query.length < 3) {
		res.json([]);
	} else {
		var reg = new RegExp(query, "i");
		User.find({ 
			$or: [
				{ "name.first": reg },
				{ "name.last": reg },
				{ "mes": reg }
			] 
		}, 
		{ "name": 1, "mes": 1 },
		function(err, users) {
			var data = [];
			users.forEach(function(user) {
				data.push({
					label: user.name.first + " " + user.name.last,
					value: user.mes
				});
			});
			res.json(data);
		});
	}
}