const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const chatRepository = require("../repositories/ChatRepository");
const messageRepository = require("../repositories/MessageRepository");
const userProfileRepository = require("../repositories/UserProfileRepository");
const { v4: uuidv4 } = require("uuid");
const {
  LATEST_MESSAGE_PROJECTION_IN_CHAT,
  USER_PROFILE_PROJECTION_IN_CHAT,
  USER_PROFILE_PROJECTION
} = require("../constants/Projections");
const chatValidator = require("../validators/ChatValidator");
const {
  getObjectsFromS3Bucket,
} = require("../aws/S3");

async function populateChat(storedChat) {
  let populatedChat = { chatId: storedChat.chatId };

  const messagePromise = messageRepository.findMessageByMessageId(
    storedChat.messageId,
    LATEST_MESSAGE_PROJECTION_IN_CHAT
  );

  const userProfilePromise = userProfileRepository.findUsersByUserId(
    storedChat.users,
    USER_PROFILE_PROJECTION_IN_CHAT
  );

  const [latestMessage, userProfiles] = await Promise.all([
    messagePromise,
    userProfilePromise,
  ]);

  await Promise.all(
    userProfiles.map(async (user) => {
      const userProfilePic = await getObjectsFromS3Bucket(
        "",
        user.profilePic,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      user.profilePic = userProfilePic;
    })
  );

  populatedChat.latestMessage = latestMessage;
  populatedChat.users = userProfiles;

  return populatedChat;
}

async function fetchOrCreateChats(receiverUserId, senderUserId) {
  try {
    
    const senderUserId = senderProfile.userId;
    const receiverProfile = await userProfileRepository.findUserByUserId(
      receiverUserId,
      USER_PROFILE_PROJECTION
    );
    chatValidator.validateReceiverProfile(receiverProfile);

    let chatInDatabase = await chatRepository.findChatByUsers(
      senderUserId,
      receiverUserId
    );

    if (chatInDatabase) {
      const populatedChat = await populateChat(chatInDatabase);
      return populatedChat;
    }

    const chatId = uuidv4();
    let chatData = {
      users: [senderUserId, receiverUserId],
      chatId,
      latestMessage: null,
    };

    logger.info(
      `Creating new chat for users=${senderUserId},${receiverUserId}`
    );
    const createdChat = await chatRepository.create(chatData);
    const populatedChat = await populateChat(createdChat);
    return populatedChat;
  } catch (error) {
    logger.error(
      `Error fetching or creating chat for users=${senderUserId},${receiverUserId}, error=${error}`
    );
    throw error;
  }
}

async function getChats(userId) {
  try {
    let chats = await chatRepository.findChatsByUserId(userId);
    chats = await Promise.all(
      chats.map(async (chat) => {
        return populateChat(chat);
      })
    );

    logger.info(
      `Fetched chat list for userId=${userId}, chats=${JSON.stringify(chats)}`
    );
    return chats;
  } catch (error) {
    logger.error(`Error fetching chats for userId=${userId}, error=${error}`);
    throw error;
  }
}

module.exports = { fetchOrCreateChats, getChats };
