const express = require("express");
const { tokenProtect } = require("../middleware/AuthMiddleware");
const {
  fetchOrCreateChatsHandler,
  getChatsHandler,
} = require("../xyz/ChatController");
const router = express.Router();

router
  .route("/fetchOrCreateChats")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    fetchOrCreateChatsHandler
  );
router
  .route("/getChats")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getChatsHandler
  );

module.exports = router;
