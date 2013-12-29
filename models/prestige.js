/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Prestige Schema
 */

var PrestigeSchema = new Schema({
	user: { type: ObjectId, index: true, ref: 'User', default: null },
 	date: { type: Number, index: true, default: new Date().getTime() },
 	report: { type: ObjectId, index: true, ref: 'Report', default: null },
 	approved: { type: Boolean, default: false },
 	description: String,
 	category: String,
 	g: { type: Number, default: 0 },
 	r: { type: Number, default: 0 },
 	n: { type: Number, default: 0 }
});

PrestigeSchema.statics = {
	findByUser: function(user, callback) {
		return this.find({ user: user }, callback);
	},
	findByReport: function(id, callback) {
		return this.find({ report: id }, callback);
	},
	findByDate: function(year, month, callback) {
		var start = new Date(year, month-1),
			end = new Date(year, month);

		var query = {
			date: {
				$gte: start,
				$lt: end
			}	
		};

		return this.find(query, callback);
	},
	findUnreported: function(callback) {
		return this.find({ report: null }, callback);
	}
};

PrestigeSchema.methods = {
	approve: function(callback) {
		this.approved = true;
		return this.save(callback);
	}
};

mongoose.model('Prestige', PrestigeSchema)