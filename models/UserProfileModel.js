const mongoose = require("mongoose");
const Personas = require("../enums/Personas");
const Gender = require("../enums/Gender");

const userProfileSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phoneNumber: { type: String},
  emailId: { type: String },
  dateOfBirth: { type: String },
  persona: {
    type: String,
    enum: Object.values(Personas),
    default: Personas.TRAVELLER,
  },
  gender: { type: String, enum: Object.values(Gender) },
  createdAt: { type: Date, default: Date.now },
  profilePic: [{ type: String }],
  userId: { type: String, required: true, unique: true },
  isEmailPrivate: { type: Boolean, default: false },
  isPhoneNumberPrivate: { type: Boolean, default: false },
  isSignupWithEmail: { type: Boolean, default: true },
});

userProfileSchema.index({ userId: 1 }, { name: "userId_single_index" });
userProfileSchema.index({ phoneNumber: 1 }, { name: "phoneNumber_single_index" });
userProfileSchema.index({ emailId: 1 }, { name: "emailId_single_index" });

module.exports = mongoose.model(
  "UserProfile",
  userProfileSchema,
  "userProfiles"
);
