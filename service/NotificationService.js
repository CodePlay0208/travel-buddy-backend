const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const notificationRepository = require("../repositories/NotificationRepository");
const userProfileRepository = require("../repositories/UserProfileRepository");
const newsletterValidator = require("../validators/NewsletterValidator");

async function getNotification(userId) {
  try {
    const fetchedNotifications =
      await notificationRepository.getNotificationsByReceiverId(userId);
     const notifications = Promise.all(fetchedNotifications.map(async (fetchedNotification)=>{
      let notification = fetchedNotification.toObject();
       const userProfile = await userProfileRepository.findUserByUserId(notification.senderId);
        notification.username = userProfile.username;
        notification.profilePic = userProfile.profilePic;
        return notification;
    }));
    logger.info(
      `Successfully sent notifications=${JSON.stringify(
        notifications
      )} for user with userId=${userId}`
    );
    return notifications;
  } catch (error) {
    logger.error(
      `Failed to send notifications to user with userId=${userId}, error=${error}`
    );
    throw error;
  }
}

async function deleteNotification(notificationId, userId) {
  try {
    const notification =
      await notificationRepository.getNotificationsByReceiverId(notificationId);
    if (notification.userId != userId) {
      throw new ValidationError(`User not allowed to delete notification`, 401);
    }
    await notificationRepository.deleteNotificationById(notificationId);
    logger.info(
      `Successfully deleted notification with notificationId=${notificationId}`
    );
  } catch (error) {
    logger.error(
      `Failed to delete notification with id=${notificationId}, error=${error}`
    );
    throw error;
  }
}

module.exports = {
  getNotification,
  deleteNotification,
};
