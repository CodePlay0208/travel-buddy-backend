const Notifications = require("../models/NotificationModel");
const logger = require("../logger");
const { ValidationError } = require("../exceptions/ValidationError");

async function createNotification(notification) {
  try {
    logger.info(`Creating notification for receiverId=${notification?.receiverId}, type=${notification?.type}`);
    
    const result = new Notifications(notification);
    const savedNotification = await result.save();
    
    logger.info(`Successfully created notification with id=${savedNotification?._id}, receiverId=${notification?.receiverId}`);
    return savedNotification;
  } catch (error) {
    logger.error(`Failed to create notification: receiverId=${notification?.receiverId}, type=${notification?.type}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while creating notification, error=${error.message}`);
  }
}

async function getNotificationsByReceiverId(
  receiverId,
  skip = 0,
  limitNumber = process.env.LIMIT_FOR_SENDING_NOTIFICATIONS
) {
  try {
    logger.info(`Getting notifications for receiverId=${receiverId}, skip=${skip}, limit=${limitNumber}`);
    
    const notifications = await Notifications.find({ receiverId })
      .skip(skip)
      .limit(limitNumber)
      .sort({
        createdAt: -1,
      })
      .lean();
    
    logger.info(`Found ${notifications?.length || 0} notifications for receiverId=${receiverId}`);
    return notifications;
  } catch (error) {
    logger.error(`Failed to get notifications for receiverId=${receiverId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while getting notifications for users with id=${receiverId}, error=${error.message}`);
  }
}

async function getNotificationsByNotificationId(notificationId) {
  try {
    logger.info(`Getting notification by notificationId=${notificationId}`);
    
    const notifications = await Notifications.findOne({
      notificationId,
    }).lean();
    
    if (notifications) {
      logger.info(`Found notification with notificationId=${notificationId}`);
    } else {
      logger.warn(`No notification found with notificationId=${notificationId}`);
    }
    
    return notifications;
  } catch (error) {
    logger.error(`Failed to get notification by notificationId=${notificationId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while getting notifications with id=${notificationId}, error=${error.message}`);
  }
}

async function deleteNotificationById(notificationId) {
  try {
    logger.info(`Deleting notification by notificationId=${notificationId}`);
    
    const result = await Notifications.deleteMany({ notificationId });
    
    logger.info(`Successfully deleted ${result.deletedCount || 0} notifications with notificationId=${notificationId}`);
  } catch (error) {
    logger.error(`Failed to delete notification by notificationId=${notificationId}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error occurred while deleting notification with id=${notificationId}, error=${error.message}`);
  }
}

module.exports = {
  getNotificationsByReceiverId,
  createNotification,
  deleteNotificationById,
};
