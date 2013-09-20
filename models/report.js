/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema

/**
 * Prestige Schema
 */

var ReportSchema = new Schema({
	date: Number,
	counts: {
		members: Number,
		trial: Number,
		expired: Number,
		total: Number
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
})

mongoose.model('Report', ReportSchema)