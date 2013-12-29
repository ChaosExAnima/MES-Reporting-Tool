var mongoose = require('mongoose'),
	dateformat = require('dateformat'),
	async = require('async'),
	Report = mongoose.model('Report'),
	User = mongoose.model('User'),
	Prestige = mongoose.model('Prestige'),
	underscore = require('underscore'),
	helper = require('./helpers');


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
		field('upcoming').array(),
		field('projects').array(),
		field('finance.start').required().isNumeric().toFloat().custom(helper.removeInvalidNumber),
		field('finance.income.sitefees').isNumeric().toFloat().custom(helper.removeInvalidNumber),
		field('finance.income.donations').isNumeric().toFloat().custom(helper.removeInvalidNumber),
		field('finance.expenses.food').isNumeric().toFloat().custom(helper.removeInvalidNumber),
		field('finance.expenses.space').isNumeric().toFloat().custom(helper.removeInvalidNumber),
		field('finance.expenses.props').isNumeric().toFloat().custom(helper.removeInvalidNumber),
		field('finance.expenses.fees').isNumeric().toFloat().custom(helper.removeInvalidNumber),
		field('elections').array(),
		field('comments.problems'),
		field('comments.suggestions'),
		field('comments.comments'),
		field('memberList').array(),
		field('nominations').array(),	
		field('das').array()
	);

	app.get(path+'/edit/:id([0-9a-z]+)/?$', this.edit);
	app.post(path+'/edit/:id([0-9a-z]+)/?$', validation, this.submit);
	app.get(path+'/view/:id([0-9a-z]+)/?$', this.view);
	app.all(path+'/delete/:id([0-9a-z]+)/?$', this.delete);
	app.get(path+'/add', this.add);
	app.post(path+'/add', validation, this.submit);
	app.get(path+'/:id([0-9a-z]+)/?$', this.detail);
	app.get(path, this.index);

	return app;
}


/**
 * Local Variables.
 */
// Default form fields.
var defaults = {
	date: dateformat('yyyy-mm'),
	upcoming: [],
	projects: [],
	finance: {
		start: "",
		income: {
			sitefees: "",
			donations: ""
		},
		expenses: {
			food: "",
			space: "",
			props: "",
			fees: ""
		}
	},
	elections: [],
	comments: {
		problems: "",
		suggestions: "",
		comments: "",
	},
	memberList: [],
	nominations: [],
	das: []
};


/**
 * Lists reports.
 */
exports.index = function(req, res) {
	Report.find({}, null, { sort: { 'date' : -1 } }, function(err, reports) {
		for (var i = 0; i < reports.length; i++) {
			reports[i] = reports[i].toObject();
			reports[i].date = dateformat(reports[i].date, 'yyyy-mm');
		};
		res.render('reports/index', {title: 'Reports', reports: reports})
	});	
}


/**
 * Shows report detail.
 */
exports.detail = function(req, res) {
	var report, claimed, unclaimed;

	async.parallel([
		// Get the report data
		function(callback) {
			Report
			.findById(req.params.id)
			.populate('nominations.recommender das.user')
			.exec(function(err, data) {
				report = _parseReportData(data.toObject());
				callback(err);
			});
		},
		// Get the report prestige
		function(callback) {
			Prestige
			.findByReport(req.params.id)
			.populate('user', 'name.first name.last mes')
			.exec(function(err, data) {
				claimed = data;
				callback(err);
			});
		},
		// Get the unclaimed prestige
		function(callback) {
			Prestige
			.findUnreported()
			.populate('user', 'name.first name.last mes')
			.exec(function(err, data) {
				unclaimed = data;
				callback(err);
			});
		}
	], function(err) {
		if(err) {
			log(err);
			setFlash("There is an error with the report.", "error");
			res.redirect('reports/');
		}

		log(claimed);

		var title = 'Report for '+report.date;
		res.render('reports/detail', {title: title, report: report, claimed: claimed, unclaimed: unclaimed});
	});
}


/**
 * Adds a report.
 */
exports.add = function(req, res) {
	var fields = {},
		form = req.form,
		viewdata = {
			positions: ['DST', 'DC'],
			stages: ['Upcoming', 'Application', 'Q/A', 'Voting']
		},
		errors = [];
		
	underscore.each(config.venues, function(venue) {
		viewdata.positions.push('VST '+venue);
	});

	if(typeof form === 'undefined') { // Initial creation.
		var date = new Date();
		date.setMonth( date.getMonth() === 0 ? 11 : date.getMonth() -1 );

		// Set default fields.
		fields = underscore.defaults({ date: dateformat(date, 'yyyy-mm') }, defaults);
	} else { // Submitted.
		fields = underscore.defaults(form, defaults);
		errors = underscore.keys(form.getErrors());
	}

	var check = function(field) {
		if(errors.indexOf(field) !== -1) {
			return "error";
		}
		return "";
	};

	res.render('reports/add', {title: 'New Report', fields: fields, data: viewdata, check: check });
}


/**
 * Edits a report.
 */
exports.edit = function(req, res) {
	Report
	.findById(req.params.id)
	.populate('nominations.recommender das.user')
	.exec(function(err, report) {
		if(err) {
			log(err);
			setFlash("Could not find report.", "error");
			res.redirect('/report');
		} else {
			var fields = {},
				form = req.form,
				viewdata = {
					positions: ['DST', 'DC'],
					stages: ['Upcoming', 'Application', 'Q/A', 'Voting']
				},
				errors = [];

			underscore.each(config.venues, function(venue) {
				viewdata.positions.push('VST '+venue);
			});

			report = report.toObject();
			_parseReportData(report);

			underscore.each(report.nominations, function(item) {
				item.recommender = item.recommender.mes;
			});
			underscore.each(report.das, function(item) {
				item.user = item.user.mes;
			});

			if(typeof form === "undefined") {
				fields = underscore.defaults(report, defaults);
			} else {
				fields = underscore.defaults(form, report, defaults);
				errors = underscore.keys(form.getErrors());
			}

			var check = function(field) {
				if(errors.indexOf(field) !== -1) {
					return "error";
				}
				return "";
			};

			res.render('reports/edit', {title: 'Editing report for '+report.date, fields: fields, data: viewdata, check: check });
		}
	});
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
	Report.findById(req.params.id, function(err, report) {
		if(err) {
			log(err);
			setFlash("Could not find report.", "error");
			res.redirect('/report');
		} else {
			// Show confirmation message.
			if(!req.param('confirm')) {
				res.render('reports/delete', { title: 'Delete Report', id: req.params.id });
			} else { // Delete the report.
				report.remove();
				setFlash("Report successfully deleted.");
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
		setFlash("Please correct the errors below.", "warning");

		if(req.params.id) {
			exports.edit(req, res);
		} else {
			exports.add(req, res);
		}
	} else {
		var report = req.form,
			parseDollars = function(val, key, list) {
				list[key] = parseInt( val * 100 );
			},
			sumDollars = function(total, num) {
				return total + num;
			},
			undoReport = function(report) {
				underscore.each(report.nominations, function(item) {
					item.recommender = item.oldRecommender;
				});
				underscore.each(report.das, function(item) {
					item.user = item.oldUser;
				});
			};

		// Sets the date.
		report.date = _parseDate(report.date);

		// Finance manipulation.
		var fin = report.finance;

		// Rounds all of the finance info.
		fin.start = parseInt( fin.start * 100 );
		underscore.each(fin.income, parseDollars);
		underscore.each(fin.expenses, parseDollars);

		// Generates the totals.
		fin.income.total = underscore.reduce(fin.income, sumDollars);
		fin.expenses.total = underscore.reduce(fin.expenses, sumDollars);
		fin.end = fin.start + fin.income.total - fin.expenses.total;

		// Runs a parallel task.
		async.parallel([
				// Sets the event dates.
				function(callback) {
					async.each(report.upcoming, function(item, done) {
						item.date = _parseDate(item.date);
						done();
					}, callback);
				},

				// Sets the member IDs for the prestige nominations.
				function(callback) {
					async.each(report.nominations, function(item, done) {
						item.mes = item.mes.toUpperCase();
						item.oldRecommender = item.recommender;
						User.findByMes(item.recommender, function(err, user) {
							if(err) done(err);
							item.recommender = user._id;
							done();
						});
					}, callback);
				},

				// Sets the member IDs for the DA listing.
				function(callback) {
					async.each(report.das, function(item, done) {
						item.oldUser = item.user;
						User.findByMes(item.user, function(err, user) {
							if(err) done(err);
							item.user = user._id;
							done();
						});
					}, callback);
				},	
			],

			// Creates the report.
			function(err) {
				if(err) {
					log("ERROR: " + err);
					setFlash("Error creating report!", "error");
					_parseReportData(report);
					undoReport(report);
					if(req.params.id) {
						exports.edit(req, res);
					} else {
						exports.add(req, res);
					}
					return;
				}

				if(req.params.id) {
					Report.findByIdAndUpdate(req.params.id, report, function(err, report) {
						if(err) {
							log("ERROR: "+ err);
							setFlash("Error creating report!", "error");
							_parseReportData(report);
							undoReport(report);
							exports.edit(req, res);
						} else {
							setFlash("Report created successfully!");
							res.redirect('/report/'+req.params.id);
						}					
					});
				} else {
					Report.create(report, function(err, report) {
						if(err) {
							log("ERROR: "+ err);
							setFlash("Error creating report!", "error");
							_parseReportData(report);
							undoReport(report);
							exports.add(req, res);
						} else {
							setFlash("Report created successfully!");
							res.redirect('/report');
						}					
					});
				}				
			}
		);	
	}
}


/**
 * Publishes a report.
 */
exports.publish = function(req, res) {

// TODO: 
// Get listing of all users, merge with awards.
// Update user's prestige and DAs.
// Set status to "Published".

}


/**
 * Utility functions.
 */

/**
 * Parses a string to a UTC date format.
 * @param  {String} input
 * @param  {Function} callback
 * @return {Number}
 */
function _parseDate(input, callback) {
	var parts = input.match(/(\d)+/g),
		date = new Date();

	if(!parts) {
		return null;
	}

	if(parts.length === 3) {
		date = new Date(parts[0], parts[1]-1, parts[2]);
	} else if(parts.length === 2) {
		date = new Date(parts[0], parts[1]-1);
	}

	if(callback) {
		callback(null, date.getTime());
	} else {
		return date.getTime();
	}
}


/**
 * Undos the parsing on a report.
 * @param  {Object} report
 * @return {Object}
 */
function _parseReportData(report) {
	var parseDollars = function(val, key, list) {
		list[key] = parseFloat(val/100);
	}

	report.date = dateformat(report.date, "yyyy-mm");
	
	report.finance.start = parseFloat( report.finance.start / 100 );
	report.finance.end = parseFloat( report.finance.end / 100 );
	underscore.each(report.finance.income, parseDollars);
	underscore.each(report.finance.expenses, parseDollars);

	underscore.each(report.upcoming, function(item) {
		item.date = dateformat(item.date, "yyyy-mm-dd");
	});

	return report;
}