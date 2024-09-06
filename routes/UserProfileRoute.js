const express = require("express");
const {tokenProtect} = require("../middleware/AuthMiddleware");
const { getUserProfileHandler , editUserHandler, deleteUserHandler } = require("../controller/UserProfileController");
const router = express.Router();

router.route("/getUserProfile").get(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), getUserProfileHandler);
router.route("/editUserProfile").put(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), editUserHandler);
router.route("/deleteUserProfile").delete(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), deleteUserHandler);

module.exports = router;