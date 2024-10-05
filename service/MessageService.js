const messageRepository = require("../repositories/MessageRepository");
const { v4: uuidv4 } = require("uuid");

async function createNewMessage(chatId, content, userId) {
  try {
    const messageId = uuidv4();
    const newMessage = {
      senderId: userId,
      content: content,
      chatId,
      messageId,
    };

    const createdMessage = messageRepository.create(newMessage);

    const updatedChat = await chatRepository.updateLatestMessage(
      chatId,
      messageId
    );

    logger.info(
      `New message created, updatedChat=${JSON.stringify(updatedChat)}`
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
    const userId = req.user.userId;
    const { chatId } = req.params;

    let messages = await messageRepository.getAllMessagesForAChat(chatId);

    messages = messages
      .filter(messages.senderId !== userId)
      .map((message) => ({ ...message, readByReceiver: true }));

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
  }
}

module.exports = { createNewMessage, getAllMessagesForAChat };
