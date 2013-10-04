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
	user: { type: ObjectId, index: true },
 	date: { type: Number, index: true },
 	description: String,
 	category: String,
 	g: Number,
 	r: Number,
 	n: Number
});

mongoose.model('Prestige', PrestigeSchema)