'use strict';


// Variables.
var fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	async = require('async'),
	util = require('util'),
	csv = require('csv'),
	dateformat = require('dateformat');

var args = process.argv.slice(2);

if( args.length < 2 ) {
	showHelp();
}

var lastMonthPath = path.resolve( __dirname, args[0] ),
	requestsPath = path.resolve( __dirname, args[1] ),
	date = new Date();
date.setMonth( date.getMonth() - 1 );

var reportPath = 'report-' + dateformat( date, 'mm-yyyy' ) + '.txt';

if( args.length === 3 ) {
	reportPath = path.resolve( __dirname, args[2] );
}

var users = [];

fs.readFile( lastMonthPath, parseReport );


/**
 * PARSE FUNCTIONS
 */

/**
 * Parses last month's report.
 * @param  {string} data The file data.
 * @return {void}
 */
function parseReport(err, data) {
	if( err ) {
		process.stderr.write('ERROR: Could not read file "' + lastMonthPath + '".\n');
		process.exit(0);
	}

	write('Parsing last month\'s data.');
	data = data.toString('utf-8');

	// Parse users.
	async.each( data.split('Member Name: '), function(string, done) {
		var user = parseUser(string);
		if(user) {
			users.push(user);
		}
		done();
	});

	write( 'Got ' + users.length + ' members:' );
	write( '  ' + getExpired(users).length + ' expired.' );
	write( '  ' + getTrial(users).length + ' trial.' );

	var columns = [ 'name', 'category', 'amount', 'backdate', 'description' ];

	fs.createReadStream( requestsPath ).pipe( csv.parse( { columns: columns }, parseRequests ) );
}


/**
 * Parses requests file to file awards.
 * @param  {object} err    Error object.
 * @param  {string} output The parsed object.
 * @return {void}
 */
function parseRequests(err, output) {
	if( err ) {
		process.stderr.write('ERROR: Could not read file "' + requestsPath + '".\n');
		process.exit(0);
	}

	write( 'Found ' + output.length + ' awards.' );

	var name = '',
		count = 0,
		categoryMap = {
			'Administration (80 max)': 'admin',
			'Non-Administrative Game Support (50 max)': 'nonadmin',
			'Social/Non-Game Support (50 max)': 'social',
			'Miscellaneous': 'misc'
		},
		capMap = {
			'admin': 80,
			'nonadmin': 50,
			'social': 50,
			'misc': -1
		};

	var findUser = function (item, callback) {
		if( item.first === name[1] && item.last === name[0] ) {
			callback(true);
		} else {
			callback(false);
		}
	};

	async.each( output, function(row, done) {
		name = row.name.split(', ');

		async.detect( users, findUser, function(result) {
			if( undefined !== result ) {
				result.awards.push({
					category: categoryMap[row.category],
					amount: parseInt( row.amount ),
					description: row.description,
					backdate: ( '' === row.backdate || dateformat(date, 'mmmm') === row.backdate ) ? false : row.backdate
				});

				result.amount += parseInt( row.amount );
			} else {
				write( 'Warning: Could not find member "' + name + '"!' );
			}

			count++;
			done();
		});
	});

	async.each( users, function(user, done) {
		user.awards = _.groupBy( user.awards, 'category' );

		_.each( user.awards, function(val, key) {
			var total = _.reduce( val, function( memo, val ) {
				if ( val.backdate ) {
					return memo;
				}
				return memo + val.amount;
			}, 0);

			// If we have overcap, reduce the totals.
			if( capMap[key] < total && -1 !== capMap[key] ) {
				write( 'Notice: ' + user.first + ' ' + user.last + ' has ' + total + ' prestige in ' + key + '.' );
				var difference = total - capMap[ key ],
					remaining = difference,
					index = 1;

				while ( remaining > 0 ) {
					var last = _.last( val, index )[0];
					last.origAmount = last.amount;
					last.amount = Math.max( 0, last.amount - difference );
					remaining -= last.amount;
					write( '  Reduced award for ' + last.description + ' to ' + last.amount + ' from ' + last.origAmount + '.' );
					index++;
				}

				// Reduce the total.
				user.amount -= difference;
			}
		});

		user.awards.backdated =
			_.chain( user.awards )
			.flatten()
			.filter(function( item ) {
				return item.backdate !== false;
			})
			.value();

		done();
	});

	write( 'Awarded ' + count + ' awards.' );

	// Parses the data and creates the template.
	var report = getTemplate(users);
	writeReport(report);
}


/**
 * Writes the report to disk.
 * @param  {string} report The report.
 * @return {void}
 */
function writeReport(report) {
	fs.writeFile( reportPath, report, function(err) {
		if( err ) {
			process.stderr.write('ERROR: Could not write file "' + reportPath + '".\n');
			process.exit(0);
		} else {
			write('Successfully wrote report "' + reportPath + '".');
		}
	});
}


/**
 * Gets a user object from a string.
 * @param  {String} data The data to look at.
 * @return {Object}      The user.
 */
function parseUser(string) {
	var mes = getValue('Membership Number: ([a-z]{2}[0-9]+)', string);

	if('' === mes) {
		return null;
	}

	var name = getValue(/^([^,]+), ([^\s]+)/, string);
	var prestige = getValue('This Month.s Total: ([0-9]+).?G,? ([0-9]+).?R,? ([0-9]+).?N,? ([0-9]+).?GT[^\n]*', string);
	if(!prestige) {
		prestige = [0, 0, 0, 0];
	}

	var user = {
		first: name[1],
		last: name[0],
		mes: mes,
		expire: getDate('Expiration Date: ([0-9\\/]+)[^\\n]*', string),
		trial: getBoolean('Expiration Date: [0-9\\/]+[^\\n]*(\\(TRIAL\\))[^\n]*', string),
		standards: getStandards(string),
		positions: getPositions(string),
		mc: parseInt( getValue( /Member Class: ?(\d+)/, string ) ),
		prestige: {
			g: parseInt(prestige[0]),
			r: parseInt(prestige[1]),
			n: parseInt(prestige[2]),
			gt: parseInt(prestige[3]),
		},
		awards: [],
		amount: 0
	};

	user.expired = (user.expire < Date.now());

	if(getValue('Expiration Date: ([^0-9\/]+)[^\n]*', string)) {
		user.expire = 0;
		user.expired = false;
	}

	return user;
}


/**
 * TEMPLATE FUNCTIONS
 */

/**
 * Gets template.
 * @param  {array} users Users with awards.
 * @return {string}      The report.
 */
function getTemplate(users) {
	// Member numbers.
	var numbers = {
		total: users.length,
		expired: getExpired(users).length,
		trial: getTrial(users).length
	};

	numbers.full = numbers.total - (numbers.expired + numbers.trial);

	// Membership report numbers.
	var highMC = getHighMC(users),
		highPrestige = getHighPrestige(users);

	// Data to return.
	var data = {
		// Data.
		date: date,
		numbers: numbers,
		highMC: highMC,
		highPrestige: highPrestige,
		users: users,

		// Functions.
		dateformat: dateformat,
		getCategoryTotal: getCategoryTotal,
		getCategoryValues: getCategoryValues
	};

	return _.template( getFile('template') )( data );
}


function getCategoryTotal(awards) {
	var iterator = function(memo, item) {
		return memo + parseInt( item.amount );
	};

	return _.reduce( awards, iterator, 0 );
}

function getCategoryValues(awards) {
	awards = _.map(awards, function(item) {
		var backdate = (item.backdate) ? ' (' + item.backdate + ')' : '',
			amount = (item.origAmount) ? item.amount + 'G (' + item.origAmount + 'G)' : item.amount + 'G';
		return item.description + backdate + ', ' + amount;
	});

	if( awards.length === 0 ) {
		return '';
	}

	return '\n' + awards.sort().join('\n') + '\n';
}


/**
 * SEARCH FUNCTIONS
 */

/**
 * Gets an array of expired members.
 * @param  {array} users Users to filter.
 * @return {array}       Expired members.
 */
function getExpired(users) {
	var predicate = function(item) {
		return item.expired === true;
	};

	return _.filter( users, predicate );
}


/**
 * Gets an array of trial members.
 * @param  {array} users Users to filter.
 * @return {array}       Trial members.
 */
function getTrial(users) {
	var predicate = function(item) {
		return item.trial === true;
	};

	return _.filter( users, predicate );
}


/**
 * Gets the high MC members.
 * @param  {array} users The users.
 * @return {array}       The high MC users.
 */
function getHighMC(users) {
	var predicate = function(item) {
		return item.mc >= 9;
	};

	var sorter = function(item) {
		return item.mc;
	};

	return _.sortBy( _.filter( users, predicate ), sorter );
}


/**
 * Gets the people with over 100 prestige this month.
 * @param  {array} users The users.
 * @return {array}       The high prestige users.
 */
function getHighPrestige(users) {
	var predicate = function(item) {
		return item.amount > 100;
	};

	var sorter = function(item) {
		return item.amount;
	};

	return _.sortBy( _.filter( users, predicate ), sorter );
}


/**
 * GET FUNCTIONS
 */

/**
 * Searches the data via regex.
 * @param  {String} regex The regex.
 * @return {String|Boolean}
 */
function getValue(regex, string) {
	if(!util.isRegExp(regex)) {
		regex = new RegExp('^'+regex+'$', 'im');
	}
	var match = string.match( regex );

	if(match !== null) {
		if(match.length > 2) {
			return match.slice(1);
		} else {
			return match[1];
		}
	}
	return '';
}


/**
 * Gets a Date from a string.
 * @param  {String} regex  The RegExp.
 * @param  {String} string The search string.
 * @return {Date}          A date object if parseable, otherwise false.
 */
function getDate(regex, string) {
	var val = getValue(regex, string);
	if(!val) {
		return false;
	}
	return new Date(val).getTime();
}


/**
 * Gets the Camarilla positions.
 * @param  {String} string The search string.
 * @return {Array}         An array of positions.
 */
function getPositions(string) {
	string = getValue('Camarilla Positions Currently Held: ([^\n]+)', string);
	if(!string) {
		return [];
	}

	var positions = [],
		strings = string.split(/,\s?/);

	strings.forEach( function(val) {
		positions.push( getValue(/([^\(]+)/, val).trim() );
	});

	return positions;
}


/**
 * Gets the standards achieved.
 * @param  {String} string The search string.
 * @return {Array}         Array of Standards acheived.
 */
function getStandards(string) {
	if(getBoolean(/(Standards:\n+Total)/, string)) {
		return [];
	}

	var tests = [],
		isInTests = false,
		lines = string.split('\n');

	for( var i = 0; i < lines.length; i++) {
		if( lines[i].indexOf('Standards') !== -1 ) {
			isInTests = true;
		} else if( lines[i].indexOf('Total Prestige') !== -1 ) {
			break;
		} else if( isInTests && lines[i].length > 2 ) {
			tests.push(lines[i]);
		}
	}

	return tests;
}


function getBoolean(regex, string) {
	return (getValue(regex, string)) ? true : false;
}


/**
 * UTILITY FUNCTIONS
 */

/**
 * Gets a file in the fixtures directory.
 * @param  {string} file The file name.
 * @return {string}      The file loaded.
 */
function getFile(file) {
	return fs.readFileSync(path.resolve(__dirname, 'fixtures/', file + '.txt')).toString();
}


/**
 * Shows the help.
 * @return {void}
 */
function showHelp() {
	write( getFile('help') );
	process.exit();
}


/**
 * Writes out text provided.
 * @param  {string} text Text to write.
 * @return {void}
 */
function write(text) {
	process.stdout.write( text + '\n' );
}
