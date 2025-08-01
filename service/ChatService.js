const logger = require("../logger");
const userProfileRepository = require("../repositories/UserProfileRepository");
const axios = require('axios');

function formatDateToDDMMYYYY(dateString) {
  try {
    logger.debug(`Formatting date: ${dateString}`);
    
    if (!dateString) {
      logger.debug(`Empty date string provided, returning empty string`);
      return '';
    }
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    logger.debug(`Successfully formatted date: ${dateString} -> ${formattedDate}`);
    return formattedDate;
  } catch (error) {
    logger.error(`Failed to format date: ${dateString}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    return '';
  }
}

async function createChat(tripInstances, userId, baseTripTitle) {
  try {
    logger.info(`Starting chat creation for userId=${userId}, baseTripTitle=${baseTripTitle}, tripInstances count=${tripInstances?.length || 0}`);
    
    for (let i = 0; i < tripInstances.length; i++) {
      const tripInstance = tripInstances[i];
      logger.info(`Processing trip instance ${i + 1}/${tripInstances.length}: tripInstanceId=${tripInstance?.tripInstanceId}`);
      
      const { startDate, endDate } = tripInstance;

      // Fetch username
      logger.debug(`Fetching user profile for userId=${userId}`);
      const user = await userProfileRepository.findUserByUserId(userId, { username: 1 });
      if (!user || !user.username) {
        logger.error(`User not found for userId=${userId}`);
        continue;
      }
      const username = user.username;
      logger.debug(`Found username=${username} for userId=${userId}`);

      logger.debug(`Formatting dates for tripInstanceId=${tripInstance.tripInstanceId}`);
      const formattedStartDate = formatDateToDDMMYYYY(startDate);
      const formattedEndDate = formatDateToDDMMYYYY(endDate);

      let title = baseTripTitle;
      if (formattedStartDate && formattedEndDate) {
        title += ` (${formattedStartDate} - ${formattedEndDate})`;
      }
      logger.debug(`Generated title: ${title} for tripInstanceId=${tripInstance.tripInstanceId}`);

      const requestBody = {
        tripInstanceId: tripInstance.tripInstanceId,
        userId,
        username,
        title,
      };

      try {
        logger.info(`Sending chat creation request to API for tripInstanceId=${tripInstance.tripInstanceId}`);
        const response = await axios.post(`${process.env.CHAT_API_URL}/createChat`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        logger.info(`Successfully created chat for tripInstanceId=${tripInstance.tripInstanceId}, response status=${response.status}`);
      } catch (error) {
        logger.error(`Failed to create chat for tripInstanceId=${tripInstance.tripInstanceId}: error=${error.message}`);
        if (error.stack) {
          logger.error(`Stack trace: ${error.stack}`);
        }
      }
    }
    
    logger.info(`Completed chat creation process for userId=${userId}`);
  } catch (error) {
    logger.error(`Failed to create chats: userId=${userId}, baseTripTitle=${baseTripTitle}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function addMemberToChat(memberId, tripInstanceId) {
  try {
    logger.info(`Adding member to chat: memberId=${memberId}, tripInstanceId=${tripInstanceId}`);

    logger.debug(`Fetching user profile for memberId=${memberId}`);
    const user = await userProfileRepository.findUserByUserId(memberId, { username: 1 });
    if (!user || !user.username) {
      logger.error(`User not found for memberId=${memberId}`);
      throw new Error(`User not found for id: ${memberId}`);
    }
    const memberName = user.username;
    logger.debug(`Found memberName=${memberName} for memberId=${memberId}`);

    const requestBody = {
      memberName,
      memberId,
      tripInstanceId,
    };

    logger.info(`Sending add member request to API for memberId=${memberId}, tripInstanceId=${tripInstanceId}`);
    await axios.post(`${process.env.CHAT_API_URL}/addMemberToChat`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    logger.info(`Successfully added member to chat: memberId=${memberId}, memberName=${memberName}, tripInstanceId=${tripInstanceId}`);
  } catch (error) {
    logger.error(`Failed to add member to chat: memberId=${memberId}, tripInstanceId=${tripInstanceId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = { createChat, addMemberToChat };
