const mongoose = require("mongoose");

const UserTrips = new mongoose.Schema({
  userId: { type: String, required: true },
  tripId: { type: Boolean, required: true },
  isWishlisted: {type: Boolean, required: true},
  isJoined: {type: Boolean, required: true},
  isRequested: {type: Boolean, required: true}
});

UserTrips.index(
  { userId: 1, isWishlisted: 1},
  { name: "userId_isWishlited_composite_index" }
);

UserTrips.index(
  { userId: 1, isJoined: 1},
  { name: "userId_isJoined_composite_index" }
);

UserTrips.index(
  { userId: 1, isRequested: 1},
  { name: "userId_isRequested_composite_index" }
);

UserTrips.index(
  { userId: 1, tripId: 1},
  { name: "userId_tripId_composite_index" }
);

UserTrips.index(
  { tripId: 1, isWishlisted: 1},
  { name: "tripId_isWishlited_composite_index" }
);

UserTrips.index(
  { tripId: 1, isJoined: 1},
  { name: "tripId_isJoined_composite_index" }
);

UserTrips.index(
  { tripId: 1, isRequested: 1},
  { name: "tripId_isRequested_composite_index" }
);

module.exports = mongoose.model("UserTrips", UserTrips);
