const express = require("express");
const { tokenProtect, tripTokenProtect } = require("../middleware/AuthMiddleware");
const {
  getUserProfileHandler,
  editUserHandler,
  deleteUserHandler,
  findUserHandler
} = require("../controller/UserProfileController");
const router = express.Router();
const { uploadMiddlewareForImages } = require("../middleware/UploadMiddleware");

router
  .route("/getUserProfile")
  .get(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    getUserProfileHandler
  );
router
  .route("/editUserProfile")
  .put(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    uploadMiddlewareForImages.array("profilePic"),
    editUserHandler
  );
router
  .route("/deleteUserProfile")
  .delete(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    deleteUserHandler
  );

router
  .route("/findUserProfile")
  .get(
    findUserHandler
  );

module.exports = router;
