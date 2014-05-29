/* jshint ignore: start */
'use strict';

// Libs.
var dateformat = require('dateformat'),
	async = require('async'),
	underscore = require('underscore'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	googleapis = require('googleapis');

// Local libs.
var helper = require('./helpers');


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

	app.get(path, this.index);
};


/**
 * Local Variables.
 */
var locals = {
	defaultFinance: {
		start: 555.03,
		incomeTotal: 490.9,
		siteFee: 490.9,
		donations: 0,
		expensesTotal: 490.9,
		space: 490.9,
		bank: 8.95,
		ending: 646.98
	},
	data : ''
},
	templateFunctions;


/**
 * Lists reports.
 */
exports.index = function(req, res) {
	var file = locals.data = fs.readFileSync(path.resolve(__dirname, '../fixtures/', 'testdata.txt')).toString();

	// Get users.
	var data = { officers: {} },
		report = '',
		strings = file.split('Member Name: ');

	// Set up parallel functions.
	var parallel = function(callback) {
		async.parallel([
			// Set correct month.
			function(callback) {
				var date = new Date();
				date.setMonth(date.getMonth()-1);
				data.date = date;
				callback();
			},

			// Set membership numbers.
			function(callback) {
				var numbers = {
					total: data.users.length,
					trial: underscore.reduce(data.users, function(t, u) {
						if(u.trial && !u.expired) {
							return t + 1;
						}
						return t;
					}, 0),
					expired: underscore.reduce(data.users, function(t, u) {
						if(u.expired) {
							return t + 1;
						}
						return t;
					}, 0)
				};
				numbers.full = numbers.total - (numbers.trial + numbers.expired);
				data.numbers = numbers;
				callback();
			},

			// Sets the DC.
			function(callback) {
				async.filter(data.users, function(user, done) {
					var pos = underscore.findWhere(user.positions, { type: 'DC' });
					if(pos) {
						done(true);
					} else {
						done(false);
					}
				}, function(result) {
					if(result) {
						data.officers.dc = result[0];
					} 
					callback();
				});
			},

			// Sets the DST.
			function(callback) {
				async.filter(data.users, function(user, done) {
					var pos = underscore.findWhere(user.positions, { type: 'DST' });
					if(pos) {
						done(true);
					} else {
						done(false);
					}
				}, function(result) {
					if(result) {
						data.officers.dst = result[0];
					} 
					callback();
				});
			},

			// Sets the aDCs.
			function(callback) {
				async.filter(data.users, function(user, done) {
					var pos = underscore.findWhere(user.positions, { type: 'aDC' });
					if(pos) {
						done(true);
					} else {
						done(false);
					}
				}, function(result) {
					data.officers.adcs = result;
					callback();
				});
			},

			// Sets the VSTs.
			function(callback) {
				async.filter(data.users, function(user, done) {
					var pos = underscore.findWhere(user.positions, { type: 'VST' });
					if(pos) {
						done(true);
					} else {
						done(false);
					}
				}, function(result) {
					data.officers.vsts = result;
					callback();
				});
			},

			// Set finance data.
			function(callback) {
				// STUB.
				var finance = locals.defaultFinance;
				var map = underscore.map(finance, function(val) {
					return parseFloat(val).toFixed(2);
				});

				data.finance = underscore.object(underscore.keys(finance), map);

				callback();
			},

			// Set the MC 9 members.
			function(callback) {
				async.filter(data.users, function(user, done) {
					if(user.prestige.mc >= 9) {
						done(true);
					} else {
						done(false);
					}
				}, function(result) {
					data.highMc = underscore.sortBy(result, function(user) { return user.prestige.mc; });
					callback();
				});
			},

			// Set the 100+ prestige members.
			function(callback) {
				async.filter(data.users, function(user, done) {
					if(user.gains.g >= 100) {
						done(true);
					} else {
						done(false);
					}
				}, function(result) {
					data.highPrestige = underscore.sortBy(result, function(user) { return user.gains.g; });
					callback();
				});
			},

			// Set the MC gains.
			function(callback) {
				async.filter(data.users, function(user, done) {
					if(user.name.last === 'Stanley') {
						user.gains.mc++;
					}

					if(user.gains.mc > 0) {
						user.prestige.mc += user.gains.mc;
						done(true);
					} else {
						done(false);
					}
				}, function(result) {
					data.mcGains = underscore.sortBy(result, function(user) { return user.gains.mc; });
					callback();
				});
			},
		], function(err) {
			callback(err);
		});
	};

	async.series([
		// Parse users.
		function(callback) {
			data.users = [];
			async.each(strings, function(string, done) {
				var user = parseUser(string);
				if(user) {
					data.users.push(user);
				}
				done();
			}, callback);
		},

		// Set gains.
		function(callback) {
			var reqs = fs.readFileSync(path.resolve(__dirname, '../fixtures/', 'requests.txt')).toString();

			var lines = reqs.split('\n');

			async.each(lines, function(line, done) {
				var arr = underscore.map(line.split(','), function(val) {
					return val.replace(/"/g, '').trim();
				});

				var user = underscore.filter(data.users, function(u) {
					return (u.name.last === arr[0] && u.name.first === arr[1]);
				});

				if(user.length) {
					user = user[0];
					user.gains.g += parseInt(arr[3]);
					user.gains.gt = user.gains.g + user.gains.r + user.gains.n;
				}
				done();
			}, callback);
		},

		// Do parallel tasks.
		parallel,

		// Set template.
		function(callback) {
			var templ = fs.readFileSync(path.resolve(__dirname, '../../../../fixtures/', 'template.txt')).toString();

			data = underscore.extend(data, templateFunctions);
			report = underscore.template(templ, data);
			
			callback();
		}
	], function(err) {
		if(err) {
			console.error('Error', err);
			return;
		}

		res.render('generator/index', { 'title': 'Generator', 'report': report });
	});	
};

/**
 * Template functions.
 */



/**
 * Utility functions.
 */

/**
 * [authenticate description]
 * @return {[type]} [description]
 */
function authenticate() {
	var authdata = config.googleapi;

	var auth = new googleapis.OAuth2Client(authdata.clientid, authdata.clientsecret, authdata.redirecturl);

	googleapis.discover('drive', 'v2').execute(function(err, client) {
		var url = auth.generateAuthUrl({ scope: authdata.scope });
  		var getAccessToken = function(code) {
	    	auth.getToken(code, function(err, tokens) {
	      		if (err) {
		        	console.error('Error while trying to retrieve access token', err);
		        	return;
	      		}
	      		auth.credentials = tokens;
	    	});
		};
		console.log('Visit the url: ', url);
		// Continue here.
	});
}


/**
 * Gets a user object from a string.
 * @param  {String} data The data to look at.
 * @return {Object}      The user.
 */
function parseUser(string) {
	var mes = getValue('Membership Number: ([a-z]{2}[0-9]+)', string);

	if(mes === false) {
		return null;
	}

	var name = getValue(/^([^,]+), ([^\s]+)/, string);
	var prestige = getValue('This Month.s Total: ([0-9]+).?G, ([0-9]+).?R, ([0-9]+).?N, ([0-9]+).?GT[^\n]*', string);
	if(!prestige) {
		prestige = [0, 0, 0, 0];
	}

	var user = {
		name: {
			first: name[1],
			last: name[0]
		},
		email: getValue('Email Address:\\s?([a-z]+@[a-z]+\\.[a-z]{3})', string),
		mes: mes,
		expire: getDate('Expiration Date: ([0-9\\/]+)[^\\n]*', string),
		trial: getBoolean('Expiration Date: [0-9\\/]+[^\\n]*(\\(TRIAL\\))[^\n]*', string),
		positions: getPositions(string),
		prestige: {
			mc: parseInt(getValue('Member Class: ([0-9]+)', string)),
			g: parseInt(prestige[0]),
			r: parseInt(prestige[1]),
			n: parseInt(prestige[2]),
			gt: parseInt(prestige[3]),
		},
		gains: {
			g: 0,
			r: 0,
			n: 0,
			gt: 0,
			mc: 0
		},
		awards: [],
		standards: getStandards(string)
	};

	user.expired = (user.expire < Date.now());

	if(getValue('Expiration Date: ([^0-9\/]+)[^\n]*', string)) {
		user.expire = 0;
		user.expired = false;
	}

	return user;
}


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

	if(match != null) {
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


function getBoolean(regex, string) {
	return (getValue(regex, string)) ? true : false;
}

function getNumber(regex, string) {
	return parseFloat(getValue(regex, string));
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

	underscore.each(strings, function(val) {
		var ends = getDate(/\(([0-9\/]+)\)/, val),
			name = getValue(/([^\(]+)/, val).trim(),
			starts = getDate(new RegExp(name+': [^,]+, [A-Z]{2}[0-9]+\nOffice Attained: ([0-9/]+)'), locals.data);

		if(name == 'DC') {
			starts = getDate(/Position: DC\n.+\nOffice Attained: ([0-9\/]+)/, locals.data);
		}

		positions.push({
			name: name,
			type: getValue(/^(a?[D|V][ST|C]{1,2})/, val),
			starts: starts ? starts : null,
			ends: ends ? ends : null
		});
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

	for(i=0; i < lines.length; i++) {
		if(lines[i].indexOf('Standards') != -1) {
			isInTests = true;
		} else if(lines[i].indexOf('Total Prestige') != -1) {
			break;
		} else if(isInTests && lines[i].length != 0) {
			tests.push(lines[i]);
		}
	}

	return tests;
}