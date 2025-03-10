const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const notificationRepository = require("../repositories/NotificationRepository");
const userProfileRepository = require("../repositories/UserProfileRepository");
const tripRepository = require("../repositories/TripRepository");
const newsletterValidator = require("../validators/NewsletterValidator");
const { getObjectsFromS3Bucket } = require("../aws/S3");

async function updateMemberProfiles(member) {
  return await getObjectsFromS3Bucket(
    "",
    member.profilePic,
    process.env.S3_BUCKET_NAME_FOR_UPLOADING_PROFILE_PIC
  );
}

async function getNotification(userId) {
  try {
    const fetchedNotifications =
      await notificationRepository.getNotificationsByReceiverId(userId);
      if(!fetchedNotifications) return [];

    const notifications = await Promise.all(
      fetchedNotifications.map(async (fetchedNotification) => {
        let notification = fetchedNotification.toObject();
        const userProfile = await userProfileRepository.findUserByUserId(
          notification.senderId
        );
        if (userProfile) {
          const fetchedUserProfile = userProfile.toObject();
          notification.username = userProfile.username;
          notification.profilePic = await updateMemberProfiles(
            fetchedUserProfile
          );
          notification.trip = await tripRepository.findTripWithTripId(
            notification.tripId
          );
          return notification;
        }
        logger.info(`Sender deleted for notificationId=${notification.notificationId}, senderId=${notification.senderId}`)
        return null;
      })
    );
    const filteredNotifications = notifications.filter(
      (notification) => notification !== null && notification !== undefined
    );

    logger.info(
      `Successfully sent notifications=${JSON.stringify(
        filteredNotifications
      )} for user with userId=${userId}`
    );

    return filteredNotifications;
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
