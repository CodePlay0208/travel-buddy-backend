const Message = require("../models/MessageModel");
const User = require("../models/UserProfile");
const Chat = require("../models/ChatModel");
const express = require("express");
const router = express.Router();

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
router.get("/getAllMessages/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username profilePic emailId")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
router.post("/createNewMessage", async (req, res) => {
  const { content, chatId } = req.body;
  console.log("the req is", req.session);

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.session.user.id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name ProfilePic")
    message = await message.populate("chat")
    message = await User.populate(message, {
      path: "chat.users",
      select: "username profilePic emailId",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    console.log("the message is", message);

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = router;