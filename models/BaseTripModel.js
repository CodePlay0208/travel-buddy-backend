const mongoose = require("mongoose");
const WEEKDAYS = require("../enums/Weekdays");

const baseTripDataSchema = new mongoose.Schema({
  destination: [{ type: String, required: true }],
  startLocation: [{ type: String, required: true }],
  minBudget: { type: Number },
  maxBudget: { type: Number },
  duration: { type: Number },
  title: { type: String, required: true },
  description: { type: String, required: true },
  destinationImages: [{ type: String }],
  croppedDestinationImages: [{ type: String }],
  hostId: { type: String, required: true },
  baseTripId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  scheduledWeekdays: [{ type: String, enum: Object.values(WEEKDAYS) }],
  dayTabs: [
    {
      dayTabId: { type: String },
      dayTitle: { type: String },
      dayDescription: [{ type: String }],
    },
  ],
  inc_exc: [
    {
      inc_excTitle: { type: String },
      inc_excDescription: [{ type: String }],
    },
  ],
});

baseTripDataSchema.index({ hostId: 1 }, { name: "hostId_single_index" });
baseTripDataSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });
baseTripDataSchema.index({ scheduledWeekdays: 1 }, { name: "scheduled)weekdays_index" });

module.exports = mongoose.model("baseTripDataSchema", baseTripDataSchema);
