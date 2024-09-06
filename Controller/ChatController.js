const Chat = require("../models/ChatModel");
const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");

const logger = require("../logger"); // import your logger

const fetchOrCreateChatsHandler = asyncHandler(async (req, res) => {
  try {
    const { recievedUserId } = req.body;
    const userId = req.user._id;

    if (!recievedUserId) {
      logger.warn("ReceiverUserId param not sent with request");
      return res.status(400).json("recieverUserId param not sent with request");
    }

    if (!userId) {
      logger.error("UserId param not sent with request");
      return res.status(400).json("User Not authenticated");
    }

    let isChat = await Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: userId } } },
        { users: { $elemMatch: { $eq: recievedUserId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await UserProfile.populate(isChat, {
      path: "latestMessage.sender",
      select: "username profilePic emailId",
    });

    logger.info(`Chat fetched for user ${userId}`);

    if (isChat.length > 0) {
      return res.send(isChat[0]);
    }

    let chatData = {
      chatName: "sender",
      users: [userId, recievedUserId],
    };

    logger.info(`Creating new chat for user ${userId}`);

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password"
    );

    logger.info(`New chat created for user ${userId}`);

    return res.status(200).json(fullChat);
  } catch (error) {
    logger.error(`Error fetching or creating chat: ${error.message}`);
    return res.status(400).json(error);
  }
});

const getChatsHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      logger.error("User not authenticated");
      return res.status(400).json("User not authenticated");
    }

    Chat.find({ users: { $elemMatch: { $eq: userId } } })
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await UserProfile.populate(results, {
          path: "latestMessage.sender",
          select: "username profilePic emailId",
        });
        logger.info(`Fetched chat list for user ${userId}`);
        return res.status(200).send(results);
      });
  } catch (error) {
    logger.error(`Error fetching chats: ${error.message}`);
    return res.status(400).json(error);
  }
});

module.exports = { fetchOrCreateChatsHandler, getChatsHandler };
