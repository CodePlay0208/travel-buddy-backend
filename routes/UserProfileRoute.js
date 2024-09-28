const express = require("express");
const {tokenProtect} = require("../middleware/AuthMiddleware");
const { getUserProfileHandler , editUserHandler, deleteUserHandler } = require("../controller/UserProfileController");
const router = express.Router();
const multer = require("multer");
const multerStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: multerStorage });


router.route("/getUserProfile").get(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), getUserProfileHandler);
router.route("/editUserProfile").put(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), uploadMiddleware.array('profilePic'), editUserHandler);
router.route("/deleteUserProfile").delete(tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN), deleteUserHandler);

module.exports = router;
