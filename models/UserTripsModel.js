const mongoose = require("mongoose");

const UserTrips = new mongoose.Schema({
  userId: { type: String, required: true },
  tripInstanceId: { type: String, required: true },
  isWishlisted: { type: Boolean, required: true },
  isJoined: { type: Boolean, required: true },
  isRequested: { type: Boolean, required: true },
  isPublished: { type: Boolean, required: true },
});

UserTrips.index(
  { userId: 1, isWishlisted: 1 },
  { name: "userId_isWishlited_composite_index" }
);

UserTrips.index(
  { userId: 1, isJoined: 1 },
  { name: "userId_isJoined_composite_index" }
);

UserTrips.index(
  { userId: 1, isRequested: 1 },
  { name: "userId_isRequested_composite_index" }
);

UserTrips.index(
  { userId: 1, isPublished: 1 },
  { name: "userId_isPublished_composite_index" }
);

UserTrips.index(
  { userId: 1, tripInstanceId: 1 },
  { name: "userId_tripId_composite_index" }
);

UserTrips.index(
  { tripInstanceId: 1, isWishlisted: 1 },
  { name: "tripInstanceId_isWishlited_composite_index" }
);

UserTrips.index(
  { tripInstanceId: 1, isJoined: 1 },
  { name: "tripInstanceId_isJoined_composite_index" }
);

UserTrips.index(
  { tripInstanceId: 1, isRequested: 1 },
  { name: "tripInstanceId_isRequested_composite_index" }
);

UserTrips.index(
  { tripInstanceId: 1, isPublished: 1 },
  { name: "tripInstanceId_isPublished_composite_index" }
);


module.exports = mongoose.model("UserTrips", UserTrips);
