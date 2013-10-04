/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
    Schema = mongoose.Schema,
    ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * User Schema
 */

var position_types = ['CC', 'aCC', 'VST', 'aVST', 'DC', 'aDC', 'DST', 'aDST', 'RC', 'aRC', 'RST', 'aRST', 'NC', 'aNC', 'NST', 'aNST', 'Other'];

var UserSchema = new Schema({
    name: {
        first: String,
        last: String
    },
    email: String,
    mes: { type: String, index: true, match: /^[A-Z]{2}[0-9]{10}$/ },
    expire: Number,
    trial: { type: Boolean, default: false },
    positions: [{
        name: String,
        type: { type: String, enum: position_types },
        starts: Number,
        ends: Number
    }],
    prestige: {
        mc: { type: Number, min: 1, max: 15 },
        g: Number,
        r: Number,
        n: Number,
        gt: Number,    
    },
    standards: [{
        name: String,
        date: Number
    }],
    disciplinaryactions: [{
        name: String,
        date: Number,
        officer: ObjectId
    }]
});

mongoose.model('User', UserSchema)