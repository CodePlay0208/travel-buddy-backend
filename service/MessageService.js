const messageRepository = require("../repositories/MessageRepository");
const chatRepository = require("../repositories/ChatRepository");
const { v4: uuidv4 } = require("uuid");
const logger = require("../logger");
const { parseLimitAndOffset } = require("../Utils");
const messageValidator = require("../validators/MessageValidator");

async function createNewMessage(chatId, content, userId) {
  try {
    const messageId = uuidv4();
    const newMessage = {
      senderId: userId,
      content: content,
      chatId,
      messageId,
    };

    messageValidator.validateIfUserBelongsToChat(userId, chatId);
    const createdMessage = await messageRepository.create(newMessage);

    const updatedChat = await chatRepository.updateLatestMessage(
      chatId,
      messageId
    );

    logger.info(
      `New message created message=${createdMessage}, updatedChat=${JSON.stringify(
        updatedChat
      )}`
    );
    return createdMessage;
  } catch (error) {
    logger.error(
      `Error creating new message for user with userId=${userId}, chatId=${chatId}, error=${error}`
    );
    throw error;
  }
}

async function getAllMessagesForAChat(userId, filter) {
  const {
    chatId,
    limit = process.env.LIMIT_ON_TOTAL_MESSAGES_PER_CHAT,
    offset = 0,
  } = filter;

  try {
    await messageValidator.validateIfUserBelongsToChat(userId, chatId);

    const { skip, limitNumber, newOffset } = parseLimitAndOffset(
      limit,
      offset,
      process.env.LIMIT_ON_TOTAL_MESSAGES_PER_CHAT
    );

    let messages = await messageRepository.findMessagesByChatId(
      chatId,
      limitNumber,
      skip
    );

    messages.forEach((message) => {
      if (message.senderId !== userId) {
        message.readByReceiver = true;
      }
    });

    logger.info(
      `Successfully fetched messages=${JSON.stringify(
        messages
      )} messages for chat with chatId=${chatId}`
    );
    return { messages, newOffset };
  } catch (error) {
    logger.error(
      `Error fetching messages for chatId=${chatId}, error=${error}`
    );
    throw error;
  }
}

module.exports = { createNewMessage, getAllMessagesForAChat };
