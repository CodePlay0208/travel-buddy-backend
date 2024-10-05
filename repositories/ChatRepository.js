const logger = require("../Logger");
const ChatModel = require("../models/ChatModel");

async function findChatByUsers(userId1, userId2) {
  try {
    const chat = await ChatModel.findOne({
      $and: [
        { users: { $elemMatch: { $eq: userId1 } } },
        { users: { $elemMatch: { $eq: userId2 } } },
      ],
    });
    return chat;
  } catch (error) {
    logger.error(
      `Error finding chats with userIds=${userId1},${userId2}, error=${error}`
    );
    throw new Error(`Error finding chats with userIds=${userId1},${userId2}`);
  }
}

async function create(chatData) {
  try {
    const createdChat = await ChatModel.create(chatData);
    return createdChat;
  } catch (error) {
    logger.error(
      `Error creating chats with chatData=${JSON.stringify(
        chatData
      )}, error=${error}`
    );
    throw new Error(
      `Error creating chats with chatData=${JSON.stringify(chatData)}`
    );
  }
}

async function findChatsByUserId(userId) {
  try {
    const chat = await ChatModel.find({
      users: { $elemMatch: { $eq: userId } },
    });
    return chat;
  } catch (error) {
    logger.error(`Error finding chat with userIds=${userId}, error=${error}`);
    throw new Error(`Error finding chats with userId=${userId}`);
  }
}

async function updateLatestMessage(chatId, messageId) {
  try {
    const updatedChat = await ChatModel.findOneAndUpdate(
      { chatId }, 
      { latestMessage: messageId }, 
      { new: true } 
    );
    return updatedChat;
  } catch (error) {
    logger.error(`Error updating chat with chatId=${chatId}, messageId=${messageId}`);
    throw new Error(`Error updating chat with chatId=${chatId}`);
  }
}


module.exports = { findChatByUsers, create, findChatsByUserId, updateLatestMessage };
