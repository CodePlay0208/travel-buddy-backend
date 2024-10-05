const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String },
    content: { type: String, trim: true },
    chatId: { type: String },
    readByReceiver: { type: Boolean },
    messageId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("MessageModel", messageSchema);
module.exports = Message;
