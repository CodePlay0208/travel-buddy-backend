const express = require("express");
const { protect } = require("../middleware/AuthMiddleware");
const {
  getUserProfileHandler,
  editUserHandler,
  deleteUserHandler,
} = require("../controller/UserProfileController");
const router = express.Router();

router.route("/getUserProfile").get(protect, getUserProfileHandler);
router.route("/editUserProfile").put(protect, editUserHandler);
router.route("/deleteUserProfile").delete(protect, deleteUserHandler);

module.exports = router;
