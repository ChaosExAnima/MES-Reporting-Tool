'use strict';
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
	first: String,
	last: { type: String, index: true },
	mes: String,
	mc: { type: Number, index: true },
	expire: { type: Date, index: true },
	positions: String,
	email: String,
	standards: [String],
	prestige: {
		g: Number,
		r: Number,
		n: Number
	}
});

var awardSchema = new Schema({
	category: { type: String, index: true },
	name: String,
	amount: Number
});

var ReportSchema = new Schema({
	date: { type: Date, index: true },
	complete: { type: Boolean, default: false },
	counts: {
		members: Number,
		trial: Number,
		expired: Number,
		total: Number
	},
	upcoming: [{
		name: String,
		date: Number
	}],
	members: {
		mc9: [userSchema],
		over100: [userSchema],
	},
	memberList: [{
		user: Schema.Types.ObjectId,
		awards: [awardSchema]
	}],
});

ReportSchema.statics = {
	findByDate: function(year, month, callback) {
		var date = new Date(year, month-1);
		return this.findOne({ date: date }, callback);
	},
	deleteByDate: function(year, month, callback) {
		var date = new Date(year, month-1);
		return this.findOneAndRemove({ date: date }, callback);
	}
};

mongoose.model('Report', ReportSchema);