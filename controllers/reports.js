var config = require('./config.js'),
	util = require('util'),
	log = function(str) { util.log( util.inspect(str) ); },
	mongoose = require('mongoose'),
	dateformat = require('dateformat'),
	Report = mongoose.model('Report')
	User = mongoose.model('User'),
	Prestige = mongoose.model('Prestige');

/**
 * Lists reports.
 */
exports.list = function(req, res) {
	
	res.render('reports/list', {title: 'Reports', nav: config.nav, cururl: '/reports', reports: []});
	return;

	Report.find({}, function(err, reports) {
		for (var i = 0; i < reports.length; i++) {
			reports[i] = reports[i].toObject();
			reports[i].link = dateformat(reports.date, 'yyyy/mm');
			reports[i].date = dateformat(reports.date, 'yyyy-mm-dd');
		};
		res.render('user_list', {title: 'Users', nav: config.nav, cururl: '/user', reports: reports})
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