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
  mes: String,
  expire: Number,
  trial: { type: Boolean, default: false },
  mc: Number,
  g: Number,
  r: Number,
  n: Number,
  gt: Number,
})

mongoose.model('User', UserSchema)