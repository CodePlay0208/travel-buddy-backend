const mongoose = require("mongoose");

const deletedUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  username: { type: String },
  email: { type: String, required: true },
  deletedAt: { type: Date, default: Date.now },
});

const DeletedUser = mongoose.model("DeletedUser", deletedUserSchema);

module.exports = DeletedUser;
