var mongoose = require('mongoose'),
	dateformat = require('dateformat'),
	async = require('async'),
	User = mongoose.model('User'),
	Prestige = mongoose.model('Prestige'),
	Report = mongoose.model('Report'),
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
		field('user').required().is(/^[a-z]{2}\d{10}$/i).toUpper(),
		field('date.month').required(),
		field('date.year').required(),
		field('description').required(),
		field('category').required(),
		field('amount').required().isNumeric()
	);

	app.get(path, this.create);
	app.post(path, validation, this.submit);
	app.get(path+'/search', this.search);
	app.post(path+'/assign', this.assign);

	return app;
}


/**
 * Local Variables.
 */
// Default form fields.
var defaults = {
	date: {
		year: new Date().getFullYear(),
		month: new Date().getMonth()
	},
	user: "",
	description: "",
	category: "",
	amount: ""
};


/**
 * Creates a new prestige entry.
 */
exports.create = function(req, res) {
	var categories = underscore.map(config.categories, function(item) {
		return {
			name: item.name,
			value: item.tag
		};
	});

	var fields = {},
		form = req.form,
		errors = [],
		view_data = {
			months: helper.monthNames(),
			years: underscore.range(defaults.date.year-1, defaults.date.year+2)
		};


	if(typeof form === 'undefined') { // Initial creation.
		fields = defaults;
	} else { // Submitted.
		fields = underscore.defaults(form, defaults);
		errors = underscore.keys(form.getErrors());
	}

	var check = function() {
		for (field in arguments) {
			if(errors.indexOf(field) !== -1) {
				return "error";
			}
		}
		return "";
	};

	res.render('prestige/create', { title: 'Create Prestige', categories: categories, fields: fields, check: check, data: view_data });
};


/**
 * Submits the prestige.
 */
exports.submit = function(req, res) {
	if(!req.form.isValid) {
		setFlash("Please correct the errors below.", "warning");
		exports.create(req, res);
	} else {
		var form = req.form;

		// Adds the prestige to the user.
		var prestige = {
			user: null,
			date: _parseDate(form.date),
		 	description: form.description,
		 	category: form.category,
		 	g: form.amount
		};

		// Runs a parallel task.
		async.parallel([
			// Gets the user.
			function(callback) {
				User.findByMes(form.user, function(err, user){
					if(err) callback(err);
					prestige.user = user._id;
					callback();
				});
			},

			// Check if a current report exists.
			function(callback) {
				var date = new Date();
				Report
				.findByDate(date.getFullYear(), date.getMonth())
				.exec(function(err, report) {
					log(report);
					if(report) {
						prestige.report = report._id;
					}
					callback(err);
				});
			}
		],

		function(err) {
			if(err) {
				log("ERROR: " + err);
				setFlash("Error assigning prestige!", "error");
				exports.create(req, res);
				return;
			}

			Prestige.create(prestige, function(err, prestige) {
				if(err) {
					log("ERROR: "+ err);
					setFlash("Error assigning prestige!", "error");
					exports.create(req, res);
				} else {
					setFlash("Prestige created successfully!");
					res.redirect('/prestige');
				}	
			});
		});
	}
};


/**
 * Searches for prestige types.
 */
exports.search = function(req, res) {
	var query = req.query.term;

	if(!query || query.length < 3) {
		res.json([]);
	} else {
		Prestige.find({ 
			description: new RegExp(query, "i")
		},
		null,
		{
			sort: { 'date' : -1 },
			limit: 10
		},
		function(err, prestige) {
			var data = underscore.map(prestige, function(item) {
				return {
					value: item.description,
					category: item.category,
					amount: item.g
				}
			});

			var list = [];

			data = underscore.filter(data, function(item) {
				if(underscore.indexOf(list, item.description) === -1) {
					list.push(item.description);
					return true;
				}
				return false;
			})
			res.json(data);
		});
	}
}


/**
 * Assigns prestige to reports.
 */
exports.assign = function(req, res) {
	var id = req.body.id,
		report = req.body.report || null;

	Prestige
	.findByIdAndUpdate(id, { report: report })
	.exec(function(err, prestige) {
		if(err) {
			log(err);
			res.json({
				code: 400,
				message: "Invalid query"
			});
			return;
		}

		log(prestige);
		res.json({
			code: 200,
			message: "Update successful"
		});
	});
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
	var date = new Date();

	if(input.month && input.year) {
		date = new Date(input.year, input.month);
	}

	if(callback) {
		callback(null, date.getTime());
	} else {
		return date.getTime();
	}
}