/**
 * Generic utility file.
 */
und = require('underscore'),
dateformat = require('dateformat');

/**
 * Gets an array of month names.
 * @return {Array}
 */
exports.monthNames = function() {
	var months = [];
	for (var i = 0; i < 12; i++) {
		months.push( dateformat(new Date(2013, i), "mmmm") );
	}
	return months;
}


/**
 * Removes values like NaN from validation.
 * @param  {*} value
 * @return {String}
 */
exports.removeInvalidNumber = function(value) {
	if(isNaN(value)) {
		return "";
	}
	return value;
}