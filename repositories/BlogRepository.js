const Blog = require("../models/BlogModel");
const logger = require("../logger");

async function create(blogData) {
  try {
    logger.info(`Creating blog with title=${blogData?.title}, authorId=${blogData?.authorId}`);
    
    const blog = new Blog(blogData);
    const createdBlog = await blog.save();
    
    logger.info(`Successfully created blog with id=${createdBlog?._id}, title=${blogData?.title}`);
    return createdBlog;
  } catch (error) {
    logger.error(`Failed to create blog: title=${blogData?.title}, authorId=${blogData?.authorId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function findById(id) {
  try {
    logger.info(`Finding blog by id=${id}`);
    
    const blog = await Blog.findById(id);
    
    if (blog) {
      logger.info(`Found blog with id=${id}, title=${blog.title}`);
    } else {
      logger.warn(`No blog found with id=${id}`);
    }
    
    return blog;
  } catch (error) {
    logger.error(`Failed to find blog by id=${id}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function findBySlug(slug) {
  try {
    logger.info(`Finding blog by slug=${slug}`);
    
    const blog = await Blog.findOne({ slug });
    
    if (blog) {
      logger.info(`Found blog with slug=${slug}, title=${blog.title}`);
    } else {
      logger.warn(`No blog found with slug=${slug}`);
    }
    
    return blog;
  } catch (error) {
    logger.error(`Failed to find blog by slug=${slug}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function updateById(id, update) {
  try {
    logger.info(`Updating blog with id=${id}`);
    
    const updatedBlog = await Blog.findByIdAndUpdate(id, update, { new: true });
    
    if (updatedBlog) {
      logger.info(`Successfully updated blog with id=${id}, title=${updatedBlog.title}`);
    } else {
      logger.warn(`No blog found to update with id=${id}`);
    }
    
    return updatedBlog;
  } catch (error) {
    logger.error(`Failed to update blog with id=${id}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function deleteById(id) {
  try {
    logger.info(`Deleting blog with id=${id}`);
    
    const deletedBlog = await Blog.findByIdAndDelete(id);
    
    if (deletedBlog) {
      logger.info(`Successfully deleted blog with id=${id}, title=${deletedBlog.title}`);
    } else {
      logger.warn(`No blog found to delete with id=${id}`);
    }
    
    return deletedBlog;
  } catch (error) {
    logger.error(`Failed to delete blog with id=${id}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function list({ page = 1, limit = 10, status, authorId, tags }) {
  try {
    logger.info(`Listing blogs: page=${page}, limit=${limit}, status=${status}, authorId=${authorId}, tags=${tags}`);
    
    const query = {};
    if (status) query.status = status;
    if (authorId) query.authorId = authorId;
    if (tags) query.tags = { $in: tags };
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Blog.countDocuments(query),
    ]);
    
    logger.info(`Found ${data?.length || 0} blogs out of ${total} total blogs`);
    return { data, total };
  } catch (error) {
    logger.error(`Failed to list blogs: page=${page}, limit=${limit}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function publish(id, status) {
  try {
    logger.info(`Publishing blog with id=${id}, status=${status}`);
    
    const publishedBlog = await Blog.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (publishedBlog) {
      logger.info(`Successfully published blog with id=${id}, status=${status}, title=${publishedBlog.title}`);
    } else {
      logger.warn(`No blog found to publish with id=${id}`);
    }
    
    return publishedBlog;
  } catch (error) {
    logger.error(`Failed to publish blog with id=${id}, status=${status}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
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
