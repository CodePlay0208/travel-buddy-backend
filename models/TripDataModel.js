const mongoose = require("mongoose");
const Gender = require("../enums/Gender");

const tripDataSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startLocation: { type: String, required: true },
  totalMembers: { type: Number, required: true },
  tripMembers: [
    {
      userId: { type: String, required: true },
      username: { type: String, required: true },
      emailId: { type: String, required: true },
      profilePic: [{ type: String }],
    },
  ],
  budget: { type: Number },
  age: { type: Number, required: true },
  gender: { type: String, enum: Object.values(Gender), required: true },
  description: { type: String, required: true },
  destinationImages: [{ type: String }],
  userId: { type: String, required: true },
  tripId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

tripDataSchema.index({ destination: 1 }, { name: "destination_single_index" });
tripDataSchema.index(
  { startDate: 1, endDate: 1 },
  { name: "start_end_date_composite_index" }
);
tripDataSchema.index(
  { destination: 1, startDate: 1, endDate: 1 },
  { name: "destination_start_end_date_composite_index" }
);
tripDataSchema.index({ userId: 1 }, { name: "userId_single_index" });
tripDataSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });

module.exports = mongoose.model("TripData", tripDataSchema);
