const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String },
  phoneNumber: { type: String},
  emailId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  profilePic: {
    type: "String",
    required: false,
    default:
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  },
});

module.exports = mongoose.model('UserProfile', userProfileSchema, "userProfiles");
