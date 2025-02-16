const mongoose = require("mongoose");

const NotificationModel = new mongoose.Schema({
  NotificationId: {type: String, required: true, unique:true},
  senderId: { type: String, required: true },
  tripId: { type: String, required: true },
  receiverId: {type: String, required: true},
  content: {type: String, required: true},
  createdAt: { type: Date, default: Date.now},
});

NotificationModel.index(
  { receiverId: 1},
  { name: "receiverId_index" }
);

module.exports = mongoose.model("NotificationModel", NotificationModel);
