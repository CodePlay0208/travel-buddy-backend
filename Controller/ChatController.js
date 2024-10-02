const Chat = require("../models/ChatModel");
const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");

const logger = require("../Logger"); // import your logger

const fetchOrCreateChatsHandler = asyncHandler(async (req, res) => {
  try {
    const { recievedUserId } = req.body;
    const userId = req.user.userId; // Assuming `userId` is passed as a string in req.user

    if (!recievedUserId) {
      logger.error("ReceiverUserId param not sent with request");
      return res.status(400).json("recieverUserId param not sent with request");
    }

    if (!userId) {
      logger.error("UserId param not sent with request");
      return res.status(400).json("User Not authenticated");
    }

    // Fetch existing chat between the two users
    let isChat = await Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: userId } } },
        { users: { $elemMatch: { $eq: recievedUserId } } },
      ],
    }).populate("latestMessage"); // Only populate latestMessage as it uses ObjectId

    // Manually populate the 'users' field by querying UserProfile
    if (isChat.length > 0) {
      isChat = await Promise.all(
        isChat.map(async (chat) => {
          const populatedUsers = await UserProfile.find({
            userId: { $in: chat.users }, // Match userId strings in UserProfile
          }).select("username profilePic emailId");

          return {
            ...chat.toObject(), // Convert to plain JS object
            users: populatedUsers, // Replace user IDs with user details
          };
        })
      );

      logger.info(`Chat fetched for user ${userId}`);
      return res.status(200).send(isChat[0]); // Return the first chat if found
    }

    // If no chat exists, create a new one
    let chatData = {
      chatName: "sender", // Default chat name
      users: [userId, recievedUserId], // Array of userId strings
    };

    logger.info(`Creating new chat for user ${userId}`);

    const createdChat = await Chat.create(chatData);

    // Fetch the newly created chat and manually populate users
    let fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "latestMessage"
    );

    const populatedUsers = await UserProfile.find({
      userId: { $in: fullChat.users },
    }).select("username profilePic emailId");

    fullChat = {
      ...fullChat.toObject(),
      users: populatedUsers, // Replace user IDs with full user data
    };

    logger.info(`New chat created for user ${userId}`);
    return res.status(200).json(fullChat);
  } catch (error) {
    logger.error(`Error fetching or creating chat: ${error.message}`);
    return res.status(400).json(error.message);
  }
});

const getChatsHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming userId is a string
    if (!userId) {
      logger.error("User not authenticated");
      return res.status(400).json("User not authenticated");
    }

    // Find chats where the user is part of the chat's 'users' array
    let chats = await Chat.find({ users: { $elemMatch: { $eq: userId } } })
      .populate("latestMessage") // Populate latestMessage (still ObjectId)
      .sort({ updatedAt: -1 });

    // Manually populate users by fetching data from UserProfile
    chats = await Promise.all(
      chats.map(async (chat) => {
        const populatedUsers = await UserProfile.find({
          userId: { $in: chat.users }, // Match userId strings in UserProfile
        }).select("username profilePic emailId");

        return {
          ...chat.toObject(), // Convert chat to plain JS object
          users: populatedUsers, // Replace userId strings with full user details
        };
      })
    );

    // Further populate the sender field in the latest message
    chats = await UserProfile.populate(chats, {
      path: "latestMessage.sender",
      select: "username profilePic emailId",
    });

    logger.info(`Fetched chat list for user ${userId}`);
    return res.status(200).send(chats);
  } catch (error) {
    logger.error(`Error fetching chats: ${error.message}`);
    return res.status(400).json(error.message);
  }
});


module.exports = { fetchOrCreateChatsHandler, getChatsHandler };
