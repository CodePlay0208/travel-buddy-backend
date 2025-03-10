const mongoose = require("mongoose");

const tempUserProfileSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phoneNumber: { type: String},
  emailId: { type: String },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: true, unique: true },
  isLoginWithEmail: { type: Boolean, default: true },
});

tempUserProfileSchema.index({ phoneNumber: 1 }, { name: "phoneNumber_single_index" });
tempUserProfileSchema.index({ emailId: 1 }, { name: "emailId_single_index" });
tempUserProfileSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });

module.exports = mongoose.model(
  "tempUserProfile",
  tempUserProfileSchema,
  "tempUserProfile"
);
