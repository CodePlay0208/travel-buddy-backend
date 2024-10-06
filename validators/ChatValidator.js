const { ValidationError } = require("../exceptions/ValidationError");
const chatRepository = require("../repositories/ChatRepository");

const chatValidator = {
  validateReceiverProfile: async (receiverProfile) => {
    if (!receiverProfile) {
      logger.error(
        `receiverId=${receiverUserId} not valid or not found in database`
      );
      throw new ValidationError(
        `receiverId=${receiverUserId} not valid or not found in database`,
        400
      );
    }
  },
};

module.exports = chatValidator;
