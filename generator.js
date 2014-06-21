'use strict';


var fs = require('fs'),
	path = require('path'),
	// underscore = require('underscore'),
	async = require('async'),
	util = require('util'),
	csv = require('csv');

var args = process.argv.slice(2);

if( 10 === args.length ) {
	showHelp();
}

var users = [],
	data = fs.readFileSync( path.resolve( __dirname, 'fixtures', 'testdata.txt' ) ).toString();

write('Found past month\'s data.');

// Parse users.
async.each( data.split('Member Name: '), function(string, done) {
	var user = parseUser(string);
	if(user) {
		users.push(user);
	}
	done();
});

write('Got '+users.length+' members.');

var columns = [ 'name', 'category', 'amount', 'backdate', 'description', 'ignore' ],
	name = '';

var parser = csv.parse({ columns: columns }, function(err, output) {
	write('Found '+output.length+' awards.');

	async.each( output, function(row, done) {
		name = row.name.split(', ');

		async.detect( users, findUser, function(result) {
			if( undefined !== result ) {
				result.awards.push({
					category: row.category,
					amount: parseInt( row.amount ),
					description: row.description,
					backdate: ( '' === row.backdate ) ? false : row.backdate
				});
			}

			done();
		});
	});
});

fs.createReadStream( __dirname + '/fixtures/requests.txt' ).pipe(parser);


function findUser(item, callback) {
	if( item.first === name[1] && item.last === name[0] ) {
		callback(true);
	}
	callback(false);
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
	var prestige = getValue('This Month.s Total: ([0-9]+).?G, ([0-9]+).?R, ([0-9]+).?N, ([0-9]+).?GT[^\n]*', string);
	if(!prestige) {
		prestige = [0, 0, 0, 0];
	}

	var user = {
		first: name[1],
		last: name[0],
		mes: mes,
		expire: getDate('Expiration Date: ([0-9\\/]+)[^\\n]*', string),
		trial: getBoolean('Expiration Date: [0-9\\/]+[^\\n]*(\\(TRIAL\\))[^\n]*', string),
		prestige: {
			g: parseInt(prestige[0]),
			r: parseInt(prestige[1]),
			n: parseInt(prestige[2]),
			gt: parseInt(prestige[3]),
		},
		awards: []
	};

	user.expired = (user.expire < Date.now());

	if(getValue('Expiration Date: ([^0-9\/]+)[^\n]*', string)) {
		user.expire = 0;
		user.expired = false;
	}

	return user;
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


function getFile(file) {
	return fs.readFileSync(path.resolve(__dirname, 'fixtures/', file + '.txt')).toString();
}

function showHelp() {
	write( getFile('help') );
	process.exit();
}

function write(text) {
	process.stdout.write( text + '\n' );
}