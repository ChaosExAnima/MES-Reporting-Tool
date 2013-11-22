var mongoose = require('mongoose'),
	dateformat = require('dateformat'),
	async = require('async'),
	Report = mongoose.model('Report'),
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
		field('date').required().isDate(),
		field('events').array(),
		field('projects').array(),
		field('finance.start').required().isNumeric().toFloat(),
		field('finance.sites').isNumeric().toFloat(),
		field('finance.donations').isNumeric().toFloat(),
		field('finance.food').isNumeric().toFloat(),
		field('finance.space').isNumeric().toFloat(),
		field('finance.prop').isNumeric().toFloat(),
		field('finance.bank').isNumeric().toFloat(),
		field('elections').array(),
		field('problems'),
		field('suggestions'),
		field('comments'),
		field('nominations').array(),	
		field('das').array()
	);

	app.get(path+'/edit/:id([0-9a-z]+)/?$', this.edit);
	app.get(path+'/view/:id([0-9a-z]+)/?$', this.view);
	app.all(path+'/delete/:id([0-9a-z]+)/?$', this.delete);
	app.get(path+'/add', this.add);
	app.post(path+'/add', validation, this.submit);
	app.get(path+'/:id([0-9a-z]+)/?$', this.detail);
	app.get(path, this.index);

	return app;
}


/**
 * Lists reports.
 */
exports.index = function(req, res) {
	Report.find({}, null, { sort: { 'date' : 1 } }, function(err, reports) {
		for (var i = 0; i < reports.length; i++) {
			reports[i] = reports[i].toObject();
			reports[i].date = dateformat(reports.date, 'yyyy-mm-dd');
		};
		res.render('reports/index', {title: 'Reports', reports: reports})
	});	
}


/**
 * Shows report detail.
 */
exports.detail = function(req, res) {
	Report.findById(req.param('id'), function(err, data) {
		if(err) {
			log(err);
			res.redirect('/reports');
		} else {
			data = data.toObject();
			data.date = dateformat(data.date, 'mmmm yyyy');

			// Format
			data.upcoming.forEach(function(election) {
				election.date = dateformat(election.date, 'yyyy-mm-dd');
			});

			User.find({}, function(err, users) {
				// log(users.length);

				async.parallel([
					function(callback) {
						async.each(data.nominations, function(item, done) {
							User.findById(item.recommender, function(err, user) {
								item.recommender = user;
								done();
							});
						}, callback);
					},
					function(callback) {
						async.each(data.das, function(item, done) {
							User.findById(item.user, function(err, user) {
								item.user = user;
								done();
							});
						}, callback);
					},
					function(callback) {
						Prestige.find({ report: req.param('id') }, null, { sort: { user: 1 } }, function(err, prestige) {
							data.prestige = prestige;
							callback();
						});
					}],
					function() {
						res.render('reports/detail', {title: 'Report for '+dateformat(data.date, 'yyyy-mm'), report: data, users: users});
					}
				)				
			});
		}
	});
}


/**
 * Adds a report.
 */
exports.add = function(req, res) {
	var fields = {},
		form = req.form,
		err = function(field) { return form.getErrors(field).length ? 'error' : '';	},
		viewdata = {
			positions: ['DST', 'DC'],
			stages: ['Upcoming', 'Application', 'Q/A', 'Voting']
		};
		
	config.venues.forEach(function(venue) {
		viewdata.positions.push('VST '+venue);		
	});

	if(typeof form === 'undefined') { // Initial creation.
		var date = new Date();
		date.setMonth( date.getMonth() === 0 ? 11 : date.getMonth() -1 );

		fields = {
			date: [dateformat(date, 'yyyy-mm'), false],
			events: [],
			projects: [],
			finance: {
				start: ['', false],
				sites: ['', false],
				donations: ['', false],
				food: ['', false],
				space: ['', false],
				prop: ['', false],
				bank: ['', false]
			},
			elections: [],
			problems: ['', false],
			suggestions: ['', false],
			comments: ['', false],
			nominations: [],
			das: []
		};

		// Get the old stuff here.
	} else { // Submitted.
		fields = {
			date: [form.date, err('date')],
			events: form.events,
			projects: form.projects,
			finance: {
				start: [form.finance.start||0, err('finance.start')],
				sites: [form.finance.sites||0, err('finance.sites')],
				donations: [form.finance.donations||0, err('finance.donations')],
				food: [form.finance.food||0, err('finance.food')],
				space: [form.finance.space||0, err('finance.space')],
				prop: [form.finance.prop||0, err('finance.prop')],
				bank: [form.finance.bank||0, err('finance.bank')]
			},
			elections: form.elections,
			problems: [form.problems, err('problems')],
			suggestions: [form.suggestions, err('suggestions')],
			comments: [form.comments, err('comments')],
			nominations: form.nominations,
			das: form.das
		};
	}

	res.render('reports/add', {title: 'New Report', fields: fields, data: viewdata });
}


/**
 * Edits a report.
 */
exports.edit = function(req, res) {

}


/**
 * Views a report.
 */
exports.view = function(req, res) {

}


/**
 * Deletes a report.
 */
exports.delete = function(req, res) {
	Report.findById(req.param('id'), function(err, report) {
		if(err) {
			log(err);
			res.redirect('/reports');
		} else {
			// Show confirmation message.
			if(!req.param('confirm')) {
				res.render('reports/delete', { title: 'Delete Report', id: req.param('id') });
			} else { // Delete the report.
				report.remove();
				res.redirect('/report');
			}
		}
	});
}


/**
 * Submits a report.
 */
exports.submit = function(req, res) {
	if(!req.form.isValid) {
		exports.add(req, res);
	} else {
		var form = req.form;

		// Rounds all of the finance info.
		for(var key in form.finance) {
			form.finance[key] = parseInt(form.finance[key] * 100);
		}

		// Add/update report.
		var report = {
			date: Date.parse(form.date) + 18000000,
			upcoming: [],
			finance: {
				start: form.finance.start,
				end: (form.finance.start + form.finance.sites + form.finance.donations) - (form.finance.food + form.finance.space + form.finance.prop + form.finance.bank),
				income: {
					total: form.finance.sites + form.finance.donations,
					sitefees: form.finance.sites,
					donations: form.finance.donations,
				},
				expenses: {
					total: form.finance.food + form.finance.space + form.finance.prop + form.finance.bank,
					food: form.finance.food,
					space: form.finance.space,
					props: form.finance.prop,
					fees: form.finance.bank,
				}
			},
			elections: [],
			projects: form.projects,
			comments: {
				problems: form.problems,
				suggestions: form.suggestions,
				comments: form.comments
			},
			nominations: [],
			das: []
		};

		async.parallel([
				function(callback) {
					async.each(form.events, function(event, done) {
						report.upcoming.push({
							date: Date.parse(event.date) + 18000000,
							name: event.name
						});
						done();
					}, callback());
				},
				function(callback) {
					async.each(form.elections, function(election, done) {
						report.elections.push({
							position: election.position,
							stage: election.stage
						});
						done();
					}, callback());
				},
				function(callback) {
					async.each(form.nominations, function(nomination, done) {
						User.findOne({ mes: nomination.recommender }, function(err, member) {
							if(err) {
								done(err);
							}
							report.nominations.push({
								name: nomination.name,
								mes: nomination.mes.toUpperCase(),
								location: nomination.domain,
								email: nomination.email,
								recommender: member.id,
								reason: nomination.reason,
								prestige: nomination.prestige
							});
							done();
						});
					}, callback());
				},
				function(callback) {
					async.each(form.das, function(da, done) {
						User.findOne({ mes: da.member }, function(err, member) {
							report.das.push({
								user: member.id,
								text: da.action
							});
							done();
						});
					}, callback());					
				},	
			],
			function(err) {
				log('Creating report...');
				if(err) {
					log("ERROR: " + err);
					exports.add(req, res);
					return;
				}
				Report.create(report, function(err, report) {
					if(err) {
						log("ERROR: "+ err);
						exports.add(req, res);
					} else {
						log("Report created successfully!");
						log("ID is: "+report.id);
						res.redirect('/report');
					}					
				});
			}
		);	
	}
}

/**
 * Utility functions.
 */