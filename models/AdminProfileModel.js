const mongoose = require("mongoose");
const Personas = require("../enums/Personas");
const Gender = require("../enums/Gender");

const adminProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  emailId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true },
});

module.exports = mongoose.model(
  "AdminProfile",
  adminProfileSchema,
  "AdminProfiles"
);
