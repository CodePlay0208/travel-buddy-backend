const logger = require("../logger");
const userProfileRepository = require("../repositories/UserProfileRepository");
const axios = require('axios');



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
      const response = await axios.post(`${process.env.CHAT_API_URL}/chat/createChat`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(response)
      logger.info(`Successfully sent chat creation to api-chat.travmigoz.com/chat/createChat for tripInstanceId=${tripInstance.tripInstanceId}, response=${JSON.stringify(response.data)}`);
    } catch (error) {
      logger.error(`Failed to send chat creation to api-chat.travmigoz.com/chat/createChat: ${error.message}`);
    }
  }
}

async function addMemberToChat(hostId, memberId, tripInstanceId) {
    try {

      const user = await userProfileRepository.findUserByUserId(memberId, { username: 1 });
      if (!user || !user.username) {
        throw new Error(`User not found for id: ${memberId}`);
      }
      const memberName = user.username;

      const requestBody = {
        hostId,
        memberName,
        memberId,
        tripId: tripInstanceId,
      };

      await axios.post(`${process.env.CHAT_API_URL}/chat/addMemberToChat`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error(`Failed to add member to chat at /chat/addMemberToChat: ${error.message}`);
    }

}

module.exports = { createChat, addMemberToChat };
