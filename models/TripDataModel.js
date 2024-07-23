const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tripDataSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  totalMembers: { type: Number, required: true },
  budget: { type: String },
  age: { type: Number, required: true },
  sex: { type: String, required: true },
  description: { type: String, required: true },
  destinationImages: [{ type: String}],
  userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true }
});

module.exports = mongoose.model('TripData', tripDataSchema);
