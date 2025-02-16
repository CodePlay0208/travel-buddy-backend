const Notifications = require("../models/NotificationModel");
const logger = require("../logger");
const { ValidationError } = require("../exceptions/ValidationError");

async function createNotification(notification) {
  try {
    const result = new Notifications(notification);
    const savedNotification = result.save();
    return savedNotification;
  } catch (error) {
    logger.error(
      `Error occurred while creating notification=${notification}, error=${error}`
    );
    throw new Error(
      `Error occurred while creating notification=${notification}, error=${error}`
    );
  }
}

async function getNotificationsByReceiverId(
  receiverId,
  skip = 0,
  limitNumber = process.env.LIMIT_FOR_SENDING_NOTIFICATIONS
) {
  try {
    const notifications = await Notifications.find({ receiverId })
      .skip(skip)
      .limit(limitNumber)
      .sort({
        createdAt: -1,
      });
    return notifications;
  } catch (error) {
    logger.error(
      `Error occurred while getting notifications for users with id=${receiverId}, error=${error}`
    );
    throw new Error(
      `Error occurred while getting notifications for users with id=${receiverId}, error=${error}`
    );
  }
}

async function getNotificationsByNotificationId(
    notificationId
  ) {
    try {
      const notifications = await Notifications.findOne({ notificationId })
      return notifications;
    } catch (error) {
      logger.error(
        `Error occurred while getting notifications with id=${notificationId}, error=${error}`
      );
      throw new Error(
        `Error occurred while getting notifications with id=${notificationId}, error=${error}`
      );
    }
  }

async function deleteNotificationById(notificationId) {
    try {
      await Notification.deleteMany({ notificationId });
    } catch (error) {
      logger.error(
        `Error occurred while deleting notification with id=${notificationId}, error=${error}`
      );
      throw new Error(
        `Error occurred while deleting notification with id=${notificationId}, error=${error}`
      );
    }
  }
  

module.exports = {
  getNotificationsByReceiverId,
  createNotification,
  deleteNotificationById
};
