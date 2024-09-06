const express = require("express");
const {tokenProtect} = require("../middleware/AuthMiddleware");
const {getAllMessagesForAChatHandler , createNewMessageHandler} = require("../controller/MessageController");
const router = express.Router();

router.route("/getAllMessages/:chatId").get(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), getAllMessagesForAChatHandler);
router.route("/createNewMessage").post(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), createNewMessageHandler);


module.exports = router;