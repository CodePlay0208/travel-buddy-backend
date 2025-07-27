const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const chatRepository = require("../repositories/ChatRepository");
const messageRepository = require("../repositories/MessageRepository");
const userProfileRepository = require("../repositories/UserProfileRepository");
const { v4: uuidv4 } = require("uuid");
const {
  LATEST_MESSAGE_PROJECTION_IN_CHAT,
  USER_PROFILE_PROJECTION_IN_CHAT
} = require("../constants/Projections");
const chatValidator = require("../validators/ChatValidator");
const {
  getObjectsFromS3Bucket,
} = require("../aws/S3");
const axios = require('axios');
const TripInstanceRepository = require('../repositories/TripInstanceRepository');

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

  const fetchedUserProfiles = userProfiles.map(user => user);

  populatedChat.users = await Promise.all(
    fetchedUserProfiles.map(async (user) => {
      const userProfilePic = await getObjectsFromS3Bucket(
        "",
        user.profilePic,
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
      );
      user.profilePic = userProfilePic;
      return user
    })
  );

  populatedChat.latestMessage = latestMessage;
  return populatedChat;
}

function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function createChat(tripInstances, userId, baseTripTitle) {
  for (const tripInstance of tripInstances) {
    const { startDate, endDate } = tripInstance;

    // Fetch username
    const user = await userProfileRepository.findUserByUserId(userId, { username: 1 });
    if (!user || !user.username) {
      logger.error(`User not found for id: ${userId}`);
      continue;
    }
    const username = user.username;

    const formattedStartDate = formatDateToDDMMYYYY(startDate);
    const formattedEndDate = formatDateToDDMMYYYY(endDate);

    let title = baseTripTitle;
    if (formattedStartDate && formattedEndDate) {
      title += ` (${formattedStartDate} - ${formattedEndDate})`;
    }

    const requestBody = {
      tripInstanceId: tripInstance.tripInstanceId,
      userId,
      username,
      title,
    };

    try {
      const response = await axios.post(`${process.env.CHAT_API_URL}/createChat`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logger.info(`Successfully sent chat creation to api-chat.travmigoz.com/createChat for tripInstanceId=${tripInstance.tripInstanceId}, response=${JSON.stringify(response)}`);
    } catch (error) {
      logger.error(`Failed to send chat creation to api-chat.travmigoz.com/createChat: ${error.message}`);
    }
  }
}

async function addMemberToChat(memberId, tripInstanceId) {
    try {

      const user = await userProfileRepository.findUserByUserId(memberId, { username: 1 });
      if (!user || !user.username) {
        throw new Error(`User not found for id: ${memberId}`);
      }
      const memberName = user.username;

      const requestBody = {
        memberName,
        memberId,
        tripInstanceId,
      };

      await axios.post(`${process.env.CHAT_API_URL}/addMemberToChat`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error(`Failed to add member to chat at /addMemberToChat: ${error.message}`);
    }

}

module.exports = { fetchOrCreateChats, getChats, createChat, addMemberToChat };
