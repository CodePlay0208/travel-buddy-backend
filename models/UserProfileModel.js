const mongoose = require("mongoose");
const Personas = require("../enums/Personas");
const Gender = require("../enums/Gender");

const userProfileSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phoneNumber: { type: String, unique: true },
  emailId: { type: String, unique: true },
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
  requestingTrips: [{ type: String }],
});

module.exports = mongoose.model(
  "UserProfile",
  userProfileSchema,
  "userProfiles"
);
