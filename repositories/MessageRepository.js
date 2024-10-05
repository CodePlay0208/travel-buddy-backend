const logger = require("../Logger");
const MessageModel = require("../models/MessageModel");

async function findMessageByMessageId(messageId, projection) {
  try {
    const chat = await MessageModel.findOne({ messageId }, projection);
    return chat;
  } catch (error) {
    logger.error(`Error finding chats with userIds=${userId1},${userId2}`);
    throw new Error(`Error finding chats with userIds=${userId1},${userId2}`);
  }
}

async function create(message) {
  try {
    const createdMessage = await MessageModel.create(message);
    return createdMessage;
  } catch (error) {
    logger.error(
      `Error creating message=${JSON.stringify(message)}, error=${error}`
    );
    throw new Error(`Error creating message=${JSON.stringify(message)}`);
  }
}

async function findMessagesByChatId(chatId) {
  try {
    const messages = await MessageModel.find({ chatId });
    return messages;
  } catch (error) {
    logger.error(`Error finding chats with userIds=${userId1},${userId2}`);
    throw new Error(`Error finding chats with userIds=${userId1},${userId2}`);
  }
}

module.exports = { findMessageByMessageId, create, findMessagesByChatId };
