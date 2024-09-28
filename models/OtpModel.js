const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  otp: { type: String},
  createdAt: { type: Date, default: Date.now, expires: "5m" },
});

OtpSchema.index({ userId: 1, createdAt: -1 }, { name: "userId_createdAt_index" });
OtpSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });


module.exports = mongoose.model("OtpSchema", OtpSchema, "OtpSchema");
