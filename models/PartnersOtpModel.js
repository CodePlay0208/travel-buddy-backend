const mongoose = require("mongoose");

const PartnersOtpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  otp: { type: String },
  createdAt: { type: Date, default: Date.now, expires: "2m" },
});

PartnersOtpSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "userId_createdAt_index" }
);
PartnersOtpSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });

module.exports = mongoose.model(
  "PartnersOtpSchema",
  PartnersOtpSchema,
  "PartnersOtpSchema"
);
