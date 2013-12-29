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
	status: { type: String, enum: ['Created', 'Published'], default: 'Created' },
	counts: {
		members: Number,
		trial: Number,
		expired: Number,
		total: Number
	},
	staff: {
		dc: { type: ObjectId, ref: 'User' },
		adcs: [{ type: ObjectId, ref: 'User' }],
		dst: { type: ObjectId, ref: 'User' },
		adsts: [{ type: ObjectId, ref: 'User' }],
		vsts: [{ type: ObjectId, ref: 'User' }]
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
		stage: String
	}],
	comments: {
		problems: String,
		suggestions: String,
		comments: String
	},
	members: {
		fresh: [Object],
		transferred: [Object],
		mc9: [Object],
		prestige: [Object],
		regional: [Object],
		national: [Object],
		mcbump: [Object],
	},
	memberlist: [{
		user: Object,
		awards: [{ type: ObjectId, ref: 'Prestige' }]
	}],
	nominations: [{
		name: String,
		mes: { type: String, match: /^[A-Z]{2}[0-9]{10}$/ },
		location: String,
		email: String,
		recommender: { type: ObjectId, ref: 'User' },
		reason: String,
		prestige: String
	}],
	das: [{
		user: { type: ObjectId, ref: 'User' },
		text: String,
		notes: String
	}]
});

ReportSchema.statics = {
	findByDate: function(year, month, callback) {
		var date = new Date(year, month).getTime();
		return this.findOne({ date: date }, callback);
	}
};

mongoose.model('Report', ReportSchema)