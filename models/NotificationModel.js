const mongoose = require("mongoose");
const NotificationEvents = require("../enums/NotificationEvents");

const NotificationModel = new mongoose.Schema({
  notificationId: {type: String, required: true, unique:true},
  senderId: { type: String, required: true },
  tripId: { type: String, required: true },
  receiverId: {type: String, required: true},
  event: { type: String, enum: Object.values(NotificationEvents) },
  createdAt: { type: Date, default: Date.now},
});

NotificationModel.index(
  { receiverId: 1},
  { name: "receiverId_index" }
);

module.exports = mongoose.model("NotificationModel", NotificationModel);
