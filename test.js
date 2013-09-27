var fs = require('fs'),
	path = require('path'),
	log = console.log;

var data = fs.readFileSync(path.resolve(__dirname, 'testdata.txt')).toString();
var users = [];

data.split('Member Name: ').forEach(function(val) {
	var user = getUser(val);
	if(user) {
		users.push(user);
	}
});

//log(users[0]);

var model = {
	date: new Date(getValue('Report Month: ([a-z]+ [0-9]{4})')),
	counts: {
		members: getValue('Number of Members: ([0-9]+)'),
		trial: getValue('Number of Trial Members: ([0-9]+)'),
		expired: getValue('Number of Expired Members: ([0-9]+)'),
		total: getValue('Number of Total Members: ([0-9]+)')
	},
	staff: {
		dc: Object,
		adcs: Array,
		dst: Object,
		adsts: Array,	
	},
	upcoming: Array,
	finance: {
		start: Number,
		end: Number,
		income: {
			total: Number,
			sitefees: Number,
			donations: Number,
		},
		expenses: {
			total: Number,
			food: Number,
			space: Number,
			props: Number,
			fees: Number,
		}
	},
	elections: Array,
	comments: {
		problems: String,
		suggestions: String,
		comments: String
	},
	members: {
		fresh: Array,
		transferred: Array,
		mc9: Array,
		prestige: Array,
		regional: Array,
		mcbump: Array,
	},
	memberlist: Array,
	nominations: Array,
	das: Array
};

/**
 * Searches the data via regex.
 * @param  {String} regex The regex.
 * @return {String|Boolean} 
 */
function getValue(regex, string) {
	if(!string) {
		string = data;
	}
	var match = string.match( new RegExp('^'+regex+'$', 'im') );
	
	log(match + "\n");

	if(match != null) {
		if(match.length > 2) {
			return match.slice(1);
		} else {
			return match[1];
		}		
	}
	return false;
}


function getDate(regex, string) {
	return new Date( getValue(regex, string) );
}

function getBoolean(regex, string) {
	return (getValue(regex, string)) ? true : false;
}

/**
 * Gets a user object from a string.
 * @param  {String} data The data to look at.
 * @return {Object}      The user.
 */
function getUser(string) {
	var mes = getValue('Membership Number: ([a-z]{2}[0-9]+)', string);

	if(mes == false) {
		return null;
	}

	var name = getValue('([^,]+), ([^\s]+)', string);
	var prestige = getValue('This Month.s Total: (\d+)\s?G, (\d+)\s?R, (\d+)\s?N, (\d+)\s?GT[^\n]*', string);

	var user = {
	  name: {
	    first: name[1],
	    last: name[0]
	  },
	  email: getValue('Email Address:\s?([a-z]+@[a-z]+\.[a-z]{3})', string),
	  mes: mes,
	  expire: getDate('Expiration Date: ([0-9\/]+)[^\n]*', string),
	  trial: getBoolean('Expiration Date: [0-9\/]+[^\n]*(\(TRIAL\))[^\n]*', string),
	  position: {
	    name: String,
	    type: String,
	    attained: Number,
	    ends: Number,
	  },
	  prestige: {
	    mc: Number,
	    g: prestige[0],
	    r: prestige[1],
	    n: prestige[2],
	    gt: prestige[3],    
	  },
	  standards: Array,
	  disciplinaryactions: Array
	};

	return user;
}