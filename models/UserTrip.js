const mongoose = require('mongoose');

const tripDataSchema = new mongoose.Schema({
  key: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  details: { type: String, required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  totalMembers: { type: Number, required: true },
  age: { type: Number, required: true },
  sex: { type: String, required: true },
  description: { type: String, required: true },
  profileImg: { type: String, required: true },
  destinationImages: [{ type: String, required: true }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true }
});

module.exports = mongoose.model('userTrip', tripDataSchema);
