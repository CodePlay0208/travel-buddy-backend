const mongoose = require("mongoose");

const tripInstanceDataSchema = new mongoose.Schema({
  destination: [{ type: String, required: true }],
  startLocation: [{ type: String, required: true }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  hostId: { type: String, required: true },
  tripInstanceId: { type: String, required: true, unique: true },
  baseTripId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

tripInstanceDataSchema.index({ destination: 1 }, { name: "destination_single_index" });
tripInstanceDataSchema.index(
  { startDate: 1, destination: 1 },
  { name: "startDate_destination_composite_index" }
);
tripInstanceDataSchema.index({ hostId: 1 }, { name: "userId_single_index" });
tripInstanceDataSchema.index({ baseTripId: 1 }, { name: "tripInstanceId_single_index" });
tripInstanceDataSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });

module.exports = mongoose.model("tripInstanceDataSchema", tripInstanceDataSchema);

