const Message = require("../models/MessageModel");
const User = require("../models/UserProfileModel");
const Chat = require("../models/ChatModel");
const asyncHandler = require("express-async-handler");
const logger = require("../Logger"); // Import the Winston logger
const UserProfile = require("../models/UserProfileModel");


const getAllMessagesForAChatHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      logger.error("User not authenticated for fetching messages");
      return res.status(400).json("User Not Authenticated");
    }

    const { chatId } = req.params;

    logger.info(`Fetching messages for chat: ${chatId}`);

    // Fetch messages for the specified chat
    let messages = await Message.find({ chat: chatId }).populate("chat");

    // Manually populate sender and readBy using userId strings from UserProfile
    if (messages.length > 0) {
      const senderIds = messages.map((msg) => msg.sender);
      const readByIds = messages.flatMap((msg) => msg.readBy);

      // Fetch user details for sender and readBy
      const usersToPopulate = await UserProfile.find({
        userId: { $in: [...new Set([...senderIds, ...readByIds])] },
      }).select("username profilePic emailId userId");

      // Map userIds to user details
      const userMap = usersToPopulate.reduce((map, user) => {
        map[user.userId] = user;
        return map;
      }, {});

      // Replace sender and readBy ids with full user details
      messages = messages.map((msg) => ({
        ...msg.toObject(),
        sender: userMap[msg.sender],
        readBy: msg.readBy.map((id) => userMap[id]),
      }));
    }

    logger.info(
      `Successfully fetched ${messages.length} messages for chat: ${chatId}`
    );
    res.json(messages);
  } catch (error) {
    logger.error(
      `Error fetching messages for chat: ${chatId} - ${error.message}`
    );
    res.status(400).json(error.message);
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

    // Construct new message data
    const newMessage = {
      sender: userId, // Use userId as string (linked to UserProfile)
      content: content,
      chat: chatId,
    };

    // Create the new message
    let message = await Message.create(newMessage);

    // Populate the sender field with user profile details
    message = await message.populate("sender", "username profilePic");
    
    // Populate the chat field
    message = await message.populate("chat");

    // Manually populate users in chat with userId as a string
    const chatUsersIds = message.chat.users;
    const usersToPopulate = await UserProfile.find({
      userId: { $in: chatUsersIds },
    }).select("username profilePic emailId userId");

    // Replace the users field with fully populated user details
    message.chat.users = usersToPopulate;

    // Update the latest message for the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    logger.info(`New message created and updated in chat: ${chatId}`);
    res.status(200).json(message);
  } catch (error) {
    logger.error(
      `Error creating new message for chat: ${chatId} - ${error.message}`
    );
    res.status(500).json(error.message);
  }
});


module.exports = { getAllMessagesForAChatHandler, createNewMessageHandler };
