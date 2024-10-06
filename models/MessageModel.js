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

messageSchema.index({chatId: 1}, {name: "chat_index_in_messages"});
messageSchema.index({senderId: 1}, {name: "senderId_index_in_messages"});
messageSchema.index({ createdAt: -1 }, { name: "createdAt_desc_index" });

const Message = mongoose.model("MessageModel", messageSchema);
module.exports = Message;
