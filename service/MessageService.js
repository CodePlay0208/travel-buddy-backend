const messageRepository = require("../repositories/MessageRepository");
const chatRepository = require("../repositories/ChatRepository");
const { v4: uuidv4 } = require("uuid");
const logger = require("../Logger");

async function createNewMessage(chatId, content, userId) {
  try {
    const messageId = uuidv4();
    const newMessage = {
      senderId: userId,
      content: content,
      chatId,
      messageId,
    };

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

async function getAllMessagesForAChat(userId, chatId) {
  try {
    let messages = await messageRepository.findMessagesByChatId(chatId);
    messages = messages.map((message) => {
      if (message.senderId !== userId) {
        return { ...message, readByReceiver: true };
      }
      return message;
    });

    logger.info(
      `Successfully fetched messages=${JSON.stringify(
        messages
      )} messages for chat with chatId=${chatId}`
    );
    return messages;
  } catch (error) {
    logger.error(
      `Error fetching messages for chatId=${chatId}, error=${error}`
    );
    throw error;
  }
}

module.exports = { createNewMessage, getAllMessagesForAChat };
