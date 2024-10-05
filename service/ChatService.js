const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../Logger");
const chatRepository = require("../repositories/ChatRepository");
const messageRepository = require("../repositories/MessageRepository");
const userProfileRepository = require("../repositories/UserProfileRepository");
const { v4: uuidv4 } = require("uuid");

function addUserProfilesToChat(populatedChat, userProfiles) {
  populatedChat.users = userProfiles.map((userProfile) => {
    const newObj = {
      userId: userProfile.userId,
      username: userProfile.username,
    };
    return newObj;
  });
}

function addLatestMessageToChat(populatedChat, latestMessage) {
  if(!latestMessage){
    return;
  }
  populatedChat.latestMessage = {};
  populatedChat.latestMessage.senderId = latestMessage.senderId;
  populatedChat.latestMessage.content = latestMessage.content;
  populatedChat.latestMessage.readByReceiver = latestMessage.readByReceiver;
}

async function populateChat(storedChat) {
  let populatedChat = storedChat;
  const messagePromise = messageRepository.findMessageByMessageId(
    storedChat.messageId
  );
  const userProfilePromise = userProfileRepository.findUsersByUserId(
    storedChat.users
  );
  const [latestMessage, userProfiles] = await Promise.all(
    messagePromise,
    userProfilePromise
  );
  addUserProfilesToChat(populatedChat, userProfiles);
  addLatestMessageToChat(populatedChat, latestMessage);
  return populatedChat;
}

async function fetchOrCreateChats(receiverUserId, senderProfile) {
  try {
    const senderUserId = senderProfile.userId;
    const receiverProfile =
      userProfileRepository.findUserByUserId(receiverUserId);
    if (!receiverProfile) {
      logger.error(
        `receiverId=${receiverUserId} not valid or not found in database`
      );
      throw new ValidationError(
        `receiverId=${receiverUserId} not valid or not found in database`,
        400
      );
    }
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
      latestMessage: null
    };

    logger.info(
      `Creating new chat for users=${senderUserId},${receiverUserId}`
    );
    const createdChat = await chatRepository.create(chatData);
    const populatedChat = await populateChat(createdChat)
    return populatedChat;
  } catch (error) {
    logger.error(`Error fetching or creating chat, error=${error}`);
    throw error;
  }
}

async function getChats(userId) {
  try {
    let chats = await chatRepository.findChatsByUserId(userId);
    chats = await Promise.all(
      chats.map(async (chat) => {
        populateChat(chat);
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
