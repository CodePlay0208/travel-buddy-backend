const mongoose = require("mongoose");
const Gender = require("../enums/Gender");

const tripDataSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startLocation: { type: String, required: true },
  minBudget: { type: Number },
  maxBudget: { type: Number },
  description: { type: String, required: true },
  destinationImages: [{ type: String }],
  croppedDestinationImages: [{ type: String }],
  userId: { type: String, required: true },
  tripId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  dayTabs: [
    { 
      dayTabId: { type: String, required: true },
      dayTitle: { type: String, required: true },
      dayDescription: [{ type: String, required: true }],
    },

  ],
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
