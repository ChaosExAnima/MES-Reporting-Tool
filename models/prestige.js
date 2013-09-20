/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema

/**
 * Prestige Schema
 */

var PrestigeSchema = new Schema({
	user: String,
 	date: Number,
 	description: String,
 	category: String,
 	g: Number,
 	r: Number,
 	n: Number
})

mongoose.model('Prestige', PrestigeSchema)