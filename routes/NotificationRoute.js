const express = require("express");
const {
  tokenProtect,
} = require("../middleware/AuthMiddleware");
const {
    getNotificationsHandler,
    deleteNotificationHandler
} = require("../controller/NotificationController");
const router = express.Router();

router
  .route("/getNotifications")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    getNotificationsHandler
  );
router
  .route("/deleteNotification")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW),
    deleteNotificationHandler
  );

module.exports = router;
