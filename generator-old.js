/* jshint ignore: start */
'use strict';

// Libs.
var dateformat = require('dateformat'),
	async = require('async'),
	underscore = require('underscore'),
	fs = require('fs'),
	path = require('path'),
	util = require('util');

// Local libs.
var helper = require('./helpers');

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





