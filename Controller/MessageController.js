const Message = require("../models/MessageModel");
const User = require("../models/UserProfileModel");
const Chat = require("../models/ChatModel");
const asyncHandler = require("express-async-handler");


const getAllMessagesForAChatHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      res.status(400).json("User Not Authenticated");
      return;
    }
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username profilePic emailId")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400).json(error);
  }
});

const createNewMessageHandler = asyncHandler(async (req, res) => {
  try {
    const { content, chatId } = req.body;
    const userId = req.user._id;

    if (!userId) {
      res.status(400).json("User Not Authenticated");
      return;
    }

    if (!content || !chatId) {
      console.log("Invalid data passed into request");
      return res.status(400).json("Invalid data passed");
    }

    var newMessage = {
      sender: userId,
      content: content,
      chat: chatId,
    };

    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name ProfilePic")
    message = await message.populate("chat")
    message = await User.populate(message, {
      path: "chat.users",
      select: "username profilePic emailId",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json(error)
  }
});

module.exports = {getAllMessagesForAChatHandler , createNewMessageHandler};