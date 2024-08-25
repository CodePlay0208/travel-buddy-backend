const Chat = require("../models/ChatModel");
const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");


const fetchOrCreateChatsHandler = asyncHandler(async (req, res) => {
  try {
  const { recievedUserId } = req.body;
  const userId = req.user._id;

  if (!recievedUserId) {
    return res.status(400).json("recieverUserId param not sent with request");
  }

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.status(400).json("User Not authenticated");
  }

  var isChat = await Chat.find({
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

  console.log("the chat is", isChat);

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      users: [userId, recievedUserId],
    };

    console.log("the chatData is", chatData);
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );

      res.status(200).json(FullChat);
    } 
  }
  catch (error) {
    res.status(400).json(error);
  }
});

const getChatsHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if(!userId){
      res.status(400).json("User ot Authenticated")
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
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = {fetchOrCreateChatsHandler, getChatsHandler}