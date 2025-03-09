const express = require("express");
const { tokenProtect, jwtTokenDecoder } = require("../middleware/AuthMiddleware");
const {
  getUserProfileHandler,
  editUserHandler,
  deleteUserHandler,
  findUserHandler,
  getOtherUserProfileHandler
} = require("../controller/UserProfileController");
const router = express.Router();
const { uploadMiddlewareForImages } = require("../middleware/UploadMiddleware");

router
  .route("/getUserProfile")
  .get(
    jwtTokenDecoder(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
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

  router
  .route("/editSecondaryKey")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    findUserHandler
  );

  router
  .route("/getOtherUserProfile")
  .post(
    getOtherUserProfileHandler
  );

module.exports = router;
