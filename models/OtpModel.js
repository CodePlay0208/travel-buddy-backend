const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  otp: { type: String},
  createdAt: { type: Date, default: Date.now, expires: "5m" },
});

OtpSchema.index({userId: 1}, {name: "userId_single_index"});

module.exports = mongoose.model("OtpSchema", OtpSchema, "OtpSchema");
