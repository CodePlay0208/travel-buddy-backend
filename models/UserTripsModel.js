const mongoose = require("mongoose");

const UserTrips = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  wishlistedTripIds: [{ type: String }],
  requestedTrips: [{ type: String }],
  requestingTrips: [{ type: String }],
  userTrips: [{type: String}]
});

module.exports = mongoose.model("UserTrips", UserTrips);
