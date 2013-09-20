var config = require('./config.js'),
	mongoose = require('mongoose');
	//Report = mongoose.model('Report')

/**
 * Lists reports.
 */
exports.list = function(req, res) {
	
	res.render('reports/list', {title: 'Reports', nav: config.nav, cururl: '/reports', reports: []});
	return;

	User.find({}, function(err, reports) {
		for (var i = 0; i < reports.length; i++) {
			reports[i] = reports[i].toObject()
			reports[i].reports = new Date(users[i].expire)
			users[i].is_expired = users[i].expire.getTime() <= new Date().getTime()
		};
		res.render('user_list', {title: 'Users', nav: config.nav, cururl: '/user', users: users})
	});	
}


exports.detail = function(req, res) {

}


exports.add = function(req, res) {
	
}


exports.submit = function(req, res) {
	
}


/**
 * Sets up routing for the reports module.
 * @param  {express} app  The Express app reference.
 * @param  {string} path The URL base for the reporting module.
 * @return {express}
 */
exports.route = function(app, path) {
	var form = require('express-form'),
		field = form.field;

	form.configure({ autoTrim: true });

	var validation = form(
			field('date').required().isDate()
		);

	app.get(path+'/:id([0-9]{4}/[0-9]{2})/?$', this.detail)
	app.get(path+'/add', this.add)
	app.post(path+'/add', validation, this.submit)
	app.get(path, this.list)

	return app;
}