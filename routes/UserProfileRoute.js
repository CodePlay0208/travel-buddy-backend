const express = require("express");
const {protect} = require("../middleware/AuthMiddleware");
const { createUserProfileHandler, getUserProfileHandler, editUserHandler, deleteUserHandler } = require("../controller/UserProfileController");
const router = express.Router();

router.route("/createUserProfile").post(createUserProfileHandler);
router.route("/getUserProfile").get(protect, getUserProfileHandler);
router.route("/editUser").put(protect, editUserHandler);
router.route("/deleteUser").delete(protect, deleteUserHandler);

module.exports = router;