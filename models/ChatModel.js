const mongoose = require("mongoose");

const chatModel = new mongoose.Schema(
  {
    users: [{ type: String }],
    latestMessage: {
      type: String,
    },
    chatId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Chat = mongoose.model("ChatModel", chatModel);

module.exports = Chat;
