const Blog = require("../models/BlogModel");

async function create(blogData) {
  const blog = new Blog(blogData);
  return await blog.save();
}

async function findById(id) {
  return await Blog.findById(id);
}

async function findBySlug(slug) {
  return await Blog.findOne({ slug });
}

async function updateById(id, update) {
  return await Blog.findByIdAndUpdate(id, update, { new: true });
}

async function deleteById(id) {
  return await Blog.findByIdAndDelete(id);
}

async function list({ page = 1, limit = 10, status, authorId, tags }) {
  const query = {};
  if (status) query.status = status;
  if (authorId) query.authorId = authorId;
  if (tags) query.tags = { $in: tags };
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Blog.countDocuments(query),
  ]);
  return { data, total };
}

async function publish(id, status) {
  return await Blog.findByIdAndUpdate(
    id,
    { status, updatedAt: new Date() },
    { new: true }
  );
}

module.exports = {
  create,
  findById,
  findBySlug,
  updateById,
  deleteById,
  list,
  publish,
};
