const mongoose = require("mongoose");

const tempUserSignUpSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  emailId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: "5h" },
});

module.exports = mongoose.model(
  "tempUserSignUpSchema",
  tempUserSignUpSchema,
  "tempUserSignUp"
);
