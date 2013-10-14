/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Prestige Schema
 */

var ReportSchema = new Schema({
	date: { type: Number, index: true },
	status: { type: String, enum: ['Created', 'Ready', 'Published'], default: 'Created' },
	counts: {
		members: Number,
		trial: Number,
		expired: Number,
		total: Number
	},
	staff: {
		dc: ObjectId,
		adcs: [ObjectId],
		dst: ObjectId,
		adsts: [ObjectId],
		vsts: [ObjectId]
	},
	upcoming: [{
		name: String,
		date: Number
	}],
	projects: [String],
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
	elections: [{
		position: String,
		stage: String,
		date: Number
	}],
	comments: {
		problems: String,
		suggestions: String,
		comments: String
	},
	members: {
		fresh: [ObjectId],
		transferred: [ObjectId],
		mc9: [ObjectId],
		prestige: [ObjectId],
		regional: [ObjectId],
		mcbump: [ObjectId],
	},
	memberlist: [{
		user: ObjectId,
		awards: [ObjectId]
	}],
	nominations: [{
		name: String,
		mes: { type: String, match: /^[A-Z]{2}[0-9]{10}$/ },
		location: String,
		email: String,
		recommender: ObjectId,
		reason: String,
		prestige: String
	}],
	das: [{
		user: ObjectId,
		text: String
	}]
})

mongoose.model('Report', ReportSchema)