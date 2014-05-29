'use strict';

/**
 * Generic utility file.
 */
var dateformat = require('dateformat'),
	underscore = require('underscore');

/**
 * Redirects to home on a DB error.
 */
exports.error = function(err, res) {
	if(err) {
		console.error('Error:', err);
		res.redirect('/');
		return false;
	}
	return true;
};

/**
 * Parses a string to a UTC date format.
 * @param  {String} input
 * @param  {Function} callback
 * @return {Number}
 */
exports.parseDate = function(input, callback) {
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
};


/**
 * Undos the parsing on a report.
 * @param  {Object} report
 * @return {Object}
 */
exports.parseReportData = function(report) {
	var parseDollars = function(val, key, list) {
		list[key] = parseFloat(val/100);
	};

	report.date = dateformat(report.date, 'yyyy-mm');
	
	report.finance.start = parseFloat( report.finance.start / 100 );
	report.finance.end = parseFloat( report.finance.end / 100 );
	underscore.each(report.finance.income, parseDollars);
	underscore.each(report.finance.expenses, parseDollars);

	underscore.each(report.upcoming, function(item) {
		item.date = dateformat(item.date, 'yyyy-mm-dd');
	});

	return report;
};

/**
 * Gets an array of month names.
 * @return {Array}
 */
exports.monthNames = function() {
	var months = [];
	for (var i = 0; i < 12; i++) {
		months.push( dateformat(new Date(2013, i), 'mmmm') );
	}
	return months;
};


/**
 * Removes values like NaN from validation.
 * @param  {*} value
 * @return {String}
 */
exports.removeInvalidNumber = function(value) {
	if(isNaN(value)) {
		return '';
	}
	return value;
};