const Message = require("../models/MessageModel");
const User = require("../models/UserProfileModel");
const Chat = require("../models/ChatModel");
const asyncHandler = require("express-async-handler");
const logger = require("../Logger"); // Import the Winston logger

const getAllMessagesForAChatHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      logger.error("User not authenticated for fetching messages");
      return res.status(400).json("User Not Authenticated");
    }

    logger.info(`Fetching messages for chat: ${req.params.chatId}`);
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username profilePic emailId")
      .populate("chat");

    logger.info(
      `Successfully fetched ${messages.length} messages for chat: ${req.params.chatId}`
    );
    res.json(messages);
  } catch (error) {
    logger.error(
      `Error fetching messages for chat: ${req.params.chatId} - ${error.message}`
    );
    res.status(400).json(error);
  }
});

const createNewMessageHandler = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  try {
    const userId = req.user.userId;

    if (!userId) {
      logger.error("User not authenticated for creating a message");
      return res.status(400).json("User Not Authenticated");
    }

    if (!content || !chatId) {
      logger.error("Invalid data passed for creating a new message");
      return res.status(400).json("Invalid data passed");
    }

    logger.info(`Creating a new message for chat: ${chatId}`);

    const newMessage = {
      sender: userId,
      content: content,
      chat: chatId,
    };

    let message = await Message.create(newMessage);
    message = await message.populate("sender", "username profilePic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username profilePic emailId",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    logger.info(`New message created and updated in chat: ${chatId}`);
    res.status(200).json(message);
  } catch (error) {
    logger.error(
      `Error creating new message for chat: ${chatId} - ${error.message}`
    );
    res.status(500).json(error);
  }
});

module.exports = { getAllMessagesForAChatHandler, createNewMessageHandler };
