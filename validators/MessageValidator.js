const { ValidationError } = require("../exceptions/ValidationError");
const chatRepository = require("../repositories/ChatRepository");

const messageValidator = {
  validateIfUserBelongsToChat: async (userId, chatId) => {
    const chat = await chatRepository.findChatsByChatId(chatId);
    const userBelongsToChat = chat.users.includes(userId);
    if (!userBelongsToChat) {
      throw new ValidationError(
        `User with userId=${userId} doesn't belongs to chat with chatId=${chatId}`
      );
    }
  },
};

module.exports = messageValidator;
