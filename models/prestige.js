/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema

/**
 * Prestige Schema
 */

var PrestigeSchema = new Schema({
	user: { type: String, index: true },
 	date: Number,
 	description: String,
 	category: String,
 	g: Number,
 	r: Number,
 	n: Number
});

mongoose.model('Prestige', PrestigeSchema)