const blogRepository = require("../repositories/BlogRepository");
const { v4: uuidv4 } = require("uuid");

async function createBlog(payload, authorId) {
  // Generate slug if not provided
  const slug =
    payload.slug ||
    payload.seo.title.toLowerCase().replace(/\s+/g, "-") +
      "-" +
      uuidv4().slice(0, 6);
  const blogData = {
    ...payload,
    slug,
    authorId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const blog = await blogRepository.create(blogData);
  return { id: blog._id, message: "Blog created successfully." };
}

async function getBlogById(id) {
  return await blogRepository.findById(id);
}

async function getBlogs(query) {
  const { page, limit, status, authorId, tags } = query;
  const { data, total } = await blogRepository.list({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
    authorId,
    tags,
  });
  return {
    data,
    pagination: {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      total,
    },
  };
}

async function updateBlog(id, update) {
  update.updatedAt = new Date();
  return await blogRepository.updateById(id, update);
}

async function deleteBlog(id) {
  return await blogRepository.deleteById(id);
}

async function publishBlog(id, status) {
  return await blogRepository.publish(id, status);
}

module.exports = {
  createBlog,
  getBlogById,
  getBlogs,
  updateBlog,
  deleteBlog,
  publishBlog,
};
