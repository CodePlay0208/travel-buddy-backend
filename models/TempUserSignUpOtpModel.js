const mongoose = require('mongoose');

const TempUserOtpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  otp: { type: String, unique: true},
  createdAt: { type: Date, default: Date.now, expires: "5m"},
});

module.exports = mongoose.model('TempUserOtpSchema', TempUserOtpSchema, "TempUserOtpSchema");
