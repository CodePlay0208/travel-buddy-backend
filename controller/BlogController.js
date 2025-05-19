const asyncHandler = require("express-async-handler");
const blogService = require("../service/BlogService");

const listBlogsHandler = asyncHandler(async (req, res) => {
  const result = await blogService.getBlogs(req.query);
  res.status(200).json(result);
});

const getBlogByIdHandler = asyncHandler(async (req, res) => {
  const blog = await blogService.getBlogById(req.params.id);
  if (!blog) return res.status(404).json({ message: "Not found" });
  res.status(200).json(blog);
});

const createBlogHandler = asyncHandler(async (req, res) => {
  // Assume req.userId is set by auth middleware
  const authorId = req.userId || req.body.authorId;
  const result = await blogService.createBlog(req.body, authorId);
  res.status(201).json(result);
});

const updateBlogHandler = asyncHandler(async (req, res) => {
  const updated = await blogService.updateBlog(req.params.id, req.body);
  res.status(200).json(updated);
});

const deleteBlogHandler = asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.params.id);
  res.status(204).send();
});

const publishBlogHandler = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await blogService.publishBlog(req.params.id, status);
  res
    .status(200)
    .json({
      id: updated._id,
      status: updated.status,
      message: "Blog is now live.",
    });
});

module.exports = {
  listBlogsHandler,
  getBlogByIdHandler,
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  publishBlogHandler,
};
