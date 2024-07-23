const express = require("express");
const {protect} = require("../middleware/AuthMiddleware");
const {getAllMessagesForAChatHandler , createNewMessageHandler} = require("../controller/MessageController");
const router = express.Router();

router.route("/getAllMessages/:chatId").get(protect, getAllMessagesForAChatHandler);
router.route("/createNewMessage").post(protect, createNewMessageHandler);


module.exports = router;