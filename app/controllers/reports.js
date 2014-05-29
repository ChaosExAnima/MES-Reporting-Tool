'use strict';

var mongoose = require('mongoose'),
	dateformat = require('dateformat'),
	async = require('async'),
	Report = mongoose.model('Report'),
	underscore = require('underscore'),
	helper = require('./helpers');

/**
 * Lists reports.
 */
exports.index = function(req, res) {
	Report.find({}, null, { sort: { 'date' : -1 } }, function(err, reports) {
		res.render('reports/index', { title: 'Reports', reports: reports });
	});	
};


/**
 * Creates a report.
 */
exports.create = function(req, res) {
	res.render('reports/create', { title: 'Create Report', months: helper.monthNames() });
};


/**
 * Submits a new report or edits an old one.
 */
exports.submit = function(req, res) {
	// We're editing something.
	if( req.params.id ) {
		// TODO
	} else {
		var data = {
			date: new Date(req.param('reportYear'), req.param('reportMonth'))
		};

		var report = new Report(data);
		report.save(function(err, report) {
			if( helper.error(err, res) ) {
				console.log(report);
				res.redirect('/');
			};
		});
	}
};


/**
 * Edits a report.
 */
exports.edit = function(req, res) {};


/**
 * Views a report.
 */
exports.view = function(req, res) {
	Report.findById(req.params.id, function(err, report) {
		if(err) {
			console.log(err);
			res.redirect('/');
			return;
		}

		var templateFunctions = {
			dateformat: dateformat,
			parsePositions: function(positions) {
				var arr = [];

				underscore.each(positions, function(pos) {
					var str = pos.name;
					if(pos.ends) {
						str += ' ('+dateformat(pos.ends, 'mm/dd/yyyy')+')';
					}
					arr.push(str);
				});

				return arr.join(', ');
			},
			isExpired: function(user) {
				if(user.expired) {
					return '(EXPIRED)';
				}
			},
			filterPosition: function(user, type) {
				var pos = underscore.findWhere(user.positions, { type: type });
				if(pos) {
					return pos;
				}
			}
		};

		console.log(report);

		var fs = require('fs'),
			path = require('path');

		var templ = fs.readFileSync(path.resolve(__dirname, '../../fixtures/', 'template.txt')).toString();

		report = underscore.template(templ, underscore.extend(report, templateFunctions) );

		res.render( 'reports/view', { title: 'Report View', report: report } );
	});
};


/**
 * Deletes a report.
 */
exports.delete = function(req, res) {
	Report.deleteByDate(req.params.year, req.params.month, function(err, report) {
		if(err) {
			console.error(err);
		}
		res.redirect('/');
	});
};