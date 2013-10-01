/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema

/**
 * User Schema
 */

var UserSchema = new Schema({
  name: {
    first: String,
    last: String
  },
  email: String,
  mes: { type: String, index: true },
  expire: Number,
  trial: { type: Boolean, default: false },
  position: Array,
  prestige: {
    mc: Number,
    g: Number,
    r: Number,
    n: Number,
    gt: Number,    
  },
  standards: Array,
  disciplinaryactions: Array
});

mongoose.model('User', UserSchema)