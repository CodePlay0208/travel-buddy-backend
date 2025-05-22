const express = require("express");
const {
  listBlogsHandler,
  getBlogByIdHandler,
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  publishBlogHandler,
  uploadBlogImageHandler,
} = require("../controller/BlogController");
const { uploadMiddlewareForImages } = require("../middleware/UploadMiddleware");
const router = express.Router();

router.get("/", listBlogsHandler);
router.post("/", uploadMiddlewareForImages.any(), createBlogHandler);
router.put("/:id", uploadMiddlewareForImages.none(), updateBlogHandler);
router.delete("/:id", deleteBlogHandler);
router.patch("/:id/publish", publishBlogHandler);
router.get("/:id", getBlogByIdHandler);
router.post(
  "/upload-image",
  uploadMiddlewareForImages.single("image"),
  uploadBlogImageHandler
);

module.exports = router;
