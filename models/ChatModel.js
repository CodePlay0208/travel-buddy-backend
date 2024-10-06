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


chatModel.index({ createdAt: -1 }, { name: "createdAt_desc_index" });
chatModel.index({ users: 1 }, { name: 'users_single_index' });

const Chat = mongoose.model("ChatModel", chatModel);
module.exports = Chat;
