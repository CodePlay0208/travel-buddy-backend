const blogRepository = require("../repositories/BlogRepository");
const { v4: uuidv4 } = require("uuid");
const logger = require("../logger");

async function createBlog(payload, authorId) {
  try {
    logger.info(`Creating blog for authorId=${authorId}, title=${payload?.seo?.title}`);
    
    // Generate slug if not provided
    const slug = payload.slug || payload.seo.title.toLowerCase().replace(/\s+/g, "-") + "-" + uuidv4().slice(0, 6);
    logger.debug(`Generated slug: ${slug} for blog`);
    
    const blogData = {
      ...payload,
      slug,
      authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    logger.info(`Saving blog to database for authorId=${authorId}`);
    const blog = await blogRepository.create(blogData);
    
    logger.info(`Successfully created blog: id=${blog._id}, authorId=${authorId}, slug=${slug}`);
    return { id: blog._id, message: "Blog created successfully." };
  } catch (error) {
    logger.error(`Failed to create blog: authorId=${authorId}, title=${payload?.seo?.title}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getBlogById(id) {
  try {
    logger.info(`Getting blog by id=${id}`);
    
    const blog = await blogRepository.findById(id);
    
    if (blog) {
      logger.info(`Successfully retrieved blog: id=${id}, title=${blog.seo?.title}`);
    } else {
      logger.warn(`No blog found with id=${id}`);
    }
    
    return blog;
  } catch (error) {
    logger.error(`Failed to get blog by id=${id}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function getBlogs(query) {
  try {
    const { page, limit, status, authorId, tags } = query;
    logger.info(`Getting blogs with query: page=${page}, limit=${limit}, status=${status}, authorId=${authorId}, tags=${tags}`);
    
    const { data, total } = await blogRepository.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      authorId,
      tags,
    });
    
    logger.info(`Successfully retrieved ${data?.length || 0} blogs out of ${total} total blogs`);
    return {
      data,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        total,
      },
    };
  } catch (error) {
    logger.error(`Failed to get blogs with query: page=${query?.page}, limit=${query?.limit}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function updateBlog(id, update) {
  try {
    logger.info(`Updating blog with id=${id}`);
    
    update.updatedAt = new Date();
    const updatedBlog = await blogRepository.updateById(id, update);
    
    if (updatedBlog) {
      logger.info(`Successfully updated blog: id=${id}, title=${updatedBlog.seo?.title}`);
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

async function deleteBlog(id) {
  try {
    logger.info(`Deleting blog with id=${id}`);
    
    const deletedBlog = await blogRepository.deleteById(id);
    
    if (deletedBlog) {
      logger.info(`Successfully deleted blog: id=${id}, title=${deletedBlog.seo?.title}`);
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

async function publishBlog(id, status) {
  try {
    logger.info(`Publishing blog with id=${id}, status=${status}`);
    
    const publishedBlog = await blogRepository.publish(id, status);
    
    if (publishedBlog) {
      logger.info(`Successfully published blog: id=${id}, status=${status}, title=${publishedBlog.seo?.title}`);
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
  createBlog,
  getBlogById,
  getBlogs,
  updateBlog,
  deleteBlog,
  publishBlog,
};
