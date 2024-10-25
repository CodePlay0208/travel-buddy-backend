const mongoose = require("mongoose");

const deletedUserSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String },
  emailId: { type: String, required: true },
  deletedAt: { type: Date, default: Date.now },
});

deletedUserSchema.index({ emailId: 1 }, { name: "emailId_single_index" });

const DeletedUser = mongoose.model("DeletedUser", deletedUserSchema);

module.exports = DeletedUser;
