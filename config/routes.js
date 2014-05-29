'use strict';

module.exports = function(app) {
	var reports = require('../app/controllers/reports');

	app.get('/edit/:year([\\d]+)/:month([\\d]+)/?$', reports.edit);
	app.get('/view/:year([\\d]+)/:month([\\d]+)/?$', reports.view);
	app.get('/delete/:year([0-9]+)/:month([0-9]+)/?$', reports.delete);
	app.get('/create', reports.create);
	app.post('/create', reports.submit);
	app.get('/', reports.index);
};