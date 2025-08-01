const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const notificationRepository = require("../repositories/NotificationRepository");
const userProfileRepository = require("../repositories/UserProfileRepository");
const tripInstanceRepository = require("../repositories/TripInstanceRepository");
const { getObjectsFromS3Bucket } = require("../aws/S3");
const cache = require("./cache");

async function updateMemberProfiles(member) {
  try {
    logger.debug(`Updating member profile picture for member: userId=${member?.userId}`);
    
    const profilePicUrl = await getObjectsFromS3Bucket(
      "",
      member.profilePic,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
    );
    
    logger.debug(`Successfully updated member profile picture for member: userId=${member?.userId}`);
    return profilePicUrl;
  } catch (error) {
    logger.error(`Failed to update member profile picture: userId=${member?.userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getNotification(userId) {
  try {
    logger.info(`Getting notifications for userId=${userId}`);
    
    const cacheKey = `notification:user:${userId}`;
    let cached = cache.get(cacheKey);
    if (cached) {
      logger.debug(`Returning cached notifications for userId=${userId}`);
      return cached;
    }
    
    logger.info(`Fetching notifications from database for userId=${userId}`);
    const fetchedNotifications = await notificationRepository.getNotificationsByReceiverId(userId);
    
    if (!fetchedNotifications || fetchedNotifications.length === 0) {
      logger.info(`No notifications found for userId=${userId}`);
      return [];
    }

    logger.info(`Processing ${fetchedNotifications.length} notifications for userId=${userId}`);
    const notifications = await Promise.all(
      fetchedNotifications.map(async (fetchedNotification, index) => {
        logger.debug(`Processing notification ${index + 1}/${fetchedNotifications.length}: notificationId=${fetchedNotification?.notificationId}`);
        
        let notification = fetchedNotification;
        const userProfile = await userProfileRepository.findUserByUserId(
          notification.senderId
        );
        
        if (userProfile) {
          logger.debug(`Found sender profile for notificationId=${notification.notificationId}, senderId=${notification.senderId}`);
          const fetchedUserProfile = userProfile;
          notification.username = userProfile.username;
          
          logger.debug(`Updating profile picture for notificationId=${notification.notificationId}`);
          notification.profilePic = await updateMemberProfiles(fetchedUserProfile);
          
          logger.debug(`Fetching trip details for notificationId=${notification.notificationId}`);
          notification.trip = await tripInstanceRepository.findTripWithTripId(
            notification.tripInstanceId
          );
          
          logger.debug(`Successfully processed notification: notificationId=${notification.notificationId}`);
          return notification;
        }
        
        logger.info(`Sender deleted for notificationId=${notification.notificationId}, senderId=${notification.senderId}`);
        return null;
      })
    );
    
    const filteredNotifications = notifications.filter(
      (notification) => notification !== null && notification !== undefined
    );

    logger.info(`Successfully processed ${filteredNotifications.length} notifications out of ${fetchedNotifications.length} for userId=${userId}`);
    
    logger.debug(`Caching notifications for userId=${userId}`);
    cache.set(cacheKey, filteredNotifications);
    
    return filteredNotifications;
  } catch (error) {
    logger.error(`Failed to get notifications for userId=${userId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function deleteNotification(notificationId, userId) {
  try {
    logger.info(`Deleting notification: notificationId=${notificationId}, userId=${userId}`);
    
    logger.debug(`Fetching notification details for notificationId=${notificationId}`);
    const notification = await notificationRepository.getNotificationsByReceiverId(notificationId);
    
    if (!notification) {
      logger.warn(`No notification found to delete with notificationId=${notificationId}`);
      throw new ValidationError(`Notification not found`, 404);
    }
    
    if (notification.userId != userId) {
      logger.warn(`User not authorized to delete notification: notificationId=${notificationId}, userId=${userId}, ownerId=${notification.userId}`);
      throw new ValidationError(`User not allowed to delete notification`, 401);
    }
    
    logger.info(`Deleting notification from database: notificationId=${notificationId}`);
    await notificationRepository.deleteNotificationById(notificationId);
    
    logger.info(`Successfully deleted notification: notificationId=${notificationId}, userId=${userId}`);
  } catch (error) {
    logger.error(`Failed to delete notification: notificationId=${notificationId}, userId=${userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = {
  getNotification,
  deleteNotification,
};
