var mongoose = require('mongoose'),
	dateformat = require('dateformat'),
	Report = mongoose.model('Report')
	User = mongoose.model('User'),
	Prestige = mongoose.model('Prestige');


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
	app.post(path+'/add/done', validation, this.submit)
	app.get(path, this.list)

	return app;
}


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
		res.render('list', {title: 'Users', nav: config.nav, cururl: '/user', reports: reports})
	});	
}


/**
 * Shows report detail.
 */
exports.detail = function(req, res) {
	
}


/**
 * Adds a report.
 */
exports.add = function(req, res) {
	

	var fields = {},
		form = req.form,
		err = function(field) {
			return form.getErrors(field).length ? 'error' : '';
		};

	if(typeof form === 'undefined') { // Initial creation.
		var date = new Date();
		date.setMonth( date.getMonth() === 0 ? 11 : date.getMonth() -1 );

		

		fields = {
			date: [dateformat(date, 'yyyy-mm'), false],
		};
	} else { // Submitted.
		fields = {
			date: [],
		}
	}

	res.render('reports/add', {title: 'New Report', nav: config.nav, cururl: '/reports', fields: fields});
}


/**
 * Edits a report.
 */
exports.edit = function(req, res) {

}


/**
 * Submits a report.
 */
exports.submit = function(req, res) {
	
}