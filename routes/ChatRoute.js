const express = require("express");
const {protect} = require("../middleware/AuthMiddleware");
const { fetchOrCreateChatsHandler, getChatsHandler } = require("../controller/ChatController");
const router = express.Router();

router.route("/fetchOrCreateChats").post(protect, fetchOrCreateChatsHandler);
router.route("/getChats").get(protect, getChatsHandler);


module.exports = router;

