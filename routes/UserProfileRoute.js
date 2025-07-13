const express = require("express");
const {
  tokenProtect,
  jwtTokenDecoder,
} = require("../middleware/AuthMiddleware");
const {
  getUserProfileHandler,
  editUserHandler,
  deleteUserHandler,
  findUserHandler,
  getOtherUserProfileHandler,
  editSecondaryKeyHandler,
  generatePreSignedUrlHandler,
  createProfileImagesHandler
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
    editUserHandler
  );
router
  .route("/deleteUserProfile")
  .delete(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    deleteUserHandler
  );

router.route("/findUserProfile").get(findUserHandler); //no use of this api

router
  .route("/editSecondaryKey")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    editSecondaryKeyHandler
  );

router.route("/getOtherUserProfile").post(getOtherUserProfileHandler);

router
  .route("/generatePreSignedUrlForProfileImages")
  .post(
    tokenProtect(process.env.JWT_SECRET_KEY_FOR_USER_LOGIN),
    generatePreSignedUrlHandler
  );

  router
  .route("/createProfileImages")
  .post(
    createProfileImagesHandler
  );

module.exports = router;
