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

/**
 * Statics
 */

UserSchema.statics = {
  /**
   * Gets current unexpired members.
   * @return {array}
   */
  getCurrent: function() {
    var today = new Date().getTime()
    return this.model('User').find({ trial: false, expire: { $gt: today } }).exec()
  },

  /**
   * Gets expired users.
   * @return {array}
   */
  getExpired: function() {
    var today = new Date().getTime()
    return this.model('User').find({ trial: false, expire: { $lte: today } })
  },

  /**
   * Gets trial members.
   * @return {array}
   */
  getTrial: function() {
    var today = new Date().getTime()
    return this.model('User').find({ trial: true, expire: { $gt: today } })
  }
}

mongoose.model('User', UserSchema)