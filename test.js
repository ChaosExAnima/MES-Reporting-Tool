var fs = require('fs'),
	path = require('path'),
	util = require('util'),
	log = function(obj) {
		util.log( util.inspect(obj, { colors: true, depth: 4 }) );
	};

String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};

var data = fs.readFileSync(path.resolve(__dirname, 'testdata.txt')).toString();

// Get users.
var users = [];
data.split('Member Name: ').forEach(function(val) {
	var user = parseUser(val);
	if(user) {
		users.push(user);
	}
});

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/prestige');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function callback() {
	log('Connected to DB.');

	// Bootstrap models
	require(__dirname + '/models/user.js');
	var User = mongoose.model('User');

	users.forEach(function(user) {
		User.update({ mes: user.mes }, user, {upsert: true}, function(err, num) {
			if(!err) {
				log(user.mes + ' updated!');
			}
		});
	});
});


/**
 * Gets a user object from a string.
 * @param  {String} data The data to look at.
 * @return {Object}      The user.
 */
function parseUser(string) {
	var mes = getValue('Membership Number: ([a-z]{2}[0-9]+)', string);

	if(mes == false) {
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
	  email: getValue('Email Address:\s?([a-z]+@[a-z]+\.[a-z]{3})', string),
	  mes: mes,
	  expire: getDate('Expiration Date: ([0-9\/]+)[^\n]*', string),
	  trial: getBoolean('Expiration Date: [0-9\/]+[^\n]*(\(TRIAL\))[^\n]*', string),
	  positions: getPositions(string),
	  prestige: {
	    mc: parseInt(getValue('Member Class: ([0-9]+)', string)),
	    g: parseInt(prestige[0]),
		r: parseInt(prestige[1]),
		n: parseInt(prestige[2]),
		gt: parseInt(prestige[3]),
	  },
	  standards: getStandards(string),
	  disciplinaryactions: []
	};

	return user;
}


/**
 * Searches the data via regex.
 * @param  {String} regex The regex.
 * @return {String|Boolean} 
 */
function getValue(regex, string) {
	if(!string) {
		string = data;
	}
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
	return false;
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

	var positions = [];
	string.split(/,\s?/).forEach(function(val) {
		var ends = getDate(/\(([0-9\/]+)\)/, val),
			name = getValue(/([^\(]+)/, val).trim(),
			starts = getDate(new RegExp(name+': [^,]+, [A-Z]{2}[0-9]+\nOffice Attained: ([0-9/]+)'));

		if(name == 'DC') {
			starts = getDate(/Position: DC\n.+\nOffice Attained: ([0-9\/]+)/);
		}

		positions.push({
			name: name,
			type: getValue(/^(a?[C|D|R|N|V][ST|C]{1,2})/, val),
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
			tests.push({ name: lines[i], date: 0 });
		}
	}

	return tests;
}