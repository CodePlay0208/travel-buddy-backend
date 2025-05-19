const express = require("express");
const {
  listBlogsHandler,
  getBlogByIdHandler,
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  publishBlogHandler,
} = require("../controller/BlogController");
const router = express.Router();

router.get("/", listBlogsHandler);
router.post("/", createBlogHandler);
router.put("/:id", updateBlogHandler);
router.delete("/:id", deleteBlogHandler);
router.patch("/:id/publish", publishBlogHandler);
router.get("/:id", getBlogByIdHandler);

module.exports = router;
