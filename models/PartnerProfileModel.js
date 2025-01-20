const mongoose = require("mongoose");
const Personas = require("../enums/Personas");
const Gender = require("../enums/Gender");

const partnerProfileSchema = new mongoose.Schema({
  username: { type: String, required: true },
  emailId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true },
});

partnerProfileSchema.index({ destination: 1 }, { name: "username_index" });

module.exports = mongoose.model(
  "PartnerProfile",
  partnerProfileSchema,
  "PartnerProfiles"
);
