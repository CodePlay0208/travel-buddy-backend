const mongoose = require("mongoose");

const UserMetadata = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    wishlistedTripIds: [{ type: String }],
  });
  
  
module.exports = mongoose.model("UserMetadata", UserMetadata);