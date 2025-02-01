const mongoose = require("mongoose");

const UserTrips = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  wishlistedTripsIds: [{ type: String }],
  requestedTripsIds: [{ type: String }],
  joinedTripsIds: [{ type: String }],
});

module.exports = mongoose.model("UserTrips", UserTrips);
