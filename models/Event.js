// server/models/Event.js
const { Schema, model, Types } = require('mongoose')
module.exports = model('Event', new Schema({
  title:      { type: String,  required: true },
  date:       { type: Date,    required: true },
  time:       { type: String,  required: true },
  duration:   { type: Number,  required: true, default: 60 }, // duration in minutes
  instructor: { type: Types.ObjectId, ref: 'Instructor', required: true },
  maxSeats:   { type: Number,  required: true },
  booked:     { type: Number,  default: 0 }
}))