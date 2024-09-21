const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tripDataSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startLocation: { type: String, required: true },
  totalMembers: { type: Number, required: true },
  budget: { type: Number },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  description: { type: String, required: true },
  destinationImages: [{ type: String }],
  userId: { type: Schema.Types.ObjectId, ref: "UserProfile", required: true },
  tripId: { type: String, required: true, unique: true },
});

tripDataSchema.index({destination: 1}, {name: "destination_single_index"});
tripDataSchema.index({startDate: 1, endDate: 1}, {name: "start_end_date_composite_index"});
tripDataSchema.index({destination:1, startDate: 1, endDate: 1}, {name: "destination_start_end_date_composite_index"});
tripDataSchema.index({userId: 1}, {name: "userId_single_index"});


module.exports = mongoose.model("TripData", tripDataSchema);
