const asyncHandler = require("express-async-handler");
const blogService = require("../service/BlogService");
const {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
} = require("../aws/S3");

const resolveBlogImages = async (blog) => {
  if (Array.isArray(blog.blogImage) && blog.blogImage.length > 0) {
    const urlObjs = await getObjectsFromS3Bucket(
      "blog-images/",
      blog.blogImage,
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );
    if (
      Array.isArray(urlObjs) &&
      urlObjs.length > 0 &&
      urlObjs[0].preSignedUrl
    ) {
      blog.blogImage = urlObjs[0].preSignedUrl;
    } else {
      blog.blogImage = "";
    }
  }
  
  if (Array.isArray(blog.sections)) {
    for (const section of blog.sections) {
      if (Array.isArray(section.images) && section.images.length > 0) {
        const urls = await getObjectsFromS3Bucket(
          "blog-images/",
          section.images,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );
        section.images = Array.isArray(urls)
          ? urls.map((u) => u.preSignedUrl || "")
          : [];
      }
    }
  }
  return blog;
};

const listBlogsHandler = asyncHandler(async (req, res) => {
  const result = await blogService.getBlogs(req.query);
  if (Array.isArray(result.data)) {
    result.data = await Promise.all(result.data.map(resolveBlogImages));
  }
  res.status(200).json(result);
});

const getBlogByIdHandler = asyncHandler(async (req, res) => {
  let blog = await blogService.getBlogById(req.params.id);
  if (!blog) return res.status(404).json({ message: "Not found" });
  blog = await resolveBlogImages(blog);
  res.status(200).json(blog);
});

const createBlogHandler = asyncHandler(async (req, res) => {
  const authorId = req.userId || req.body.authorId;
  let blogImageUrl = undefined;

  let blogImageFile = null;
  if (Array.isArray(req.files)) {
    blogImageFile = req.files.find((f) => f.fieldname === "blogImage");
  }
  if (blogImageFile) {
    const { originalname, buffer, mimetype } = blogImageFile;
    const file = { originalname, buffer, mimetype };
    const { uploadedObjectNames, allObjectsUploaded } =
      await uploadObjectsToS3Bucket(
        "blog-images/",
        [file],
        process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
      );
    if (!allObjectsUploaded) {
      return res.status(500).json({ message: "Failed to upload image" });
    }
    blogImageUrl = [uploadedObjectNames[0]];
  }

  let blogData = { ...req.body, blogImage: blogImageUrl };
  if (typeof blogData.seo === "string") blogData.seo = JSON.parse(blogData.seo);
  if (typeof blogData.hero === "string")
    blogData.hero = JSON.parse(blogData.hero);
  if (typeof blogData.sections === "string")
    blogData.sections = JSON.parse(blogData.sections);
  if (typeof blogData.tags === "string")
    blogData.tags = JSON.parse(blogData.tags);

  if (typeof blogData.blogImage === "string") {
    blogData.blogImage = blogData.blogImage.split(",").map((s) => s.trim());
  } else if (!Array.isArray(blogData.blogImage)) {
    blogData.blogImage = [];
  }

  if (Array.isArray(blogData.sections) && Array.isArray(req.files)) {
    const sectionImageFiles = req.files.filter((f) =>
      f.fieldname.startsWith("sectionImage-")
    );
    if (sectionImageFiles.length > 0) {
      const filesToUpload = sectionImageFiles.map((f) => ({
        originalname: f.originalname,
        buffer: f.buffer,
        mimetype: f.mimetype,
      }));
      const { uploadedObjectNames, allObjectsUploaded } =
        await uploadObjectsToS3Bucket(
          "blog-images/",
          filesToUpload,
          process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
        );
      if (!allObjectsUploaded) {
        return res
          .status(500)
          .json({ message: "Failed to upload section images" });
      }
      sectionImageFiles.forEach((f, idx) => {
        const parts = f.fieldname.split("-");
        if (parts.length === 3) {
          const sectionIdx = parseInt(parts[1], 10);
          const imgIdx = parseInt(parts[2], 10);
          if (
            blogData.sections[sectionIdx] &&
            Array.isArray(blogData.sections[sectionIdx].images)
          ) {
             blogData.sections[sectionIdx].images[imgIdx] =
              uploadedObjectNames[idx];
          }
        }
      });
    }
  }

  if (Array.isArray(blogData.sections)) {
    blogData.sections = blogData.sections.map((section) => ({
      ...section,
      images: Array.isArray(section.images)
        ? section.images.flatMap((img) =>
            typeof img === "string" && img.includes(",")
              ? img.split(",").map((s) => s.trim())
              : [String(img)]
          )
        : [],
    }));
  }

  const result = await blogService.createBlog(blogData, authorId);
  res.status(201).json(result);
});

const updateBlogHandler = asyncHandler(async (req, res) => {
  let update = { ...req.body };
  if (typeof update.seo === "string") update.seo = JSON.parse(update.seo);
  if (typeof update.hero === "string") update.hero = JSON.parse(update.hero);
  if (typeof update.sections === "string")
    update.sections = JSON.parse(update.sections);
  if (typeof update.tags === "string") update.tags = JSON.parse(update.tags);

  if (Array.isArray(update.sections)) {
    update.sections = update.sections.map((section) => ({
      ...section,
      images: Array.isArray(section.images)
        ? section.images.map((img) => String(img))
        : [],
    }));
  }

  const updated = await blogService.updateBlog(req.params.id, update);
  res.status(200).json(updated);
});

const deleteBlogHandler = asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.params.id);
  res.status(204).send();
});

const publishBlogHandler = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await blogService.publishBlog(req.params.id, status);
  res.status(200).json({
    id: updated._id,
    status: updated.status,
    message: "Blog is now live.",
  });
});

const uploadBlogImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file uploaded" });
  }
  const { originalname, buffer, mimetype } = req.file;
  const file = {
    originalname,
    buffer,
    mimetype,
  };
  const { uploadedObjectNames, allObjectsUploaded } =
    await uploadObjectsToS3Bucket(
      "blog-images/",
      [file],
      process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES
    );
  if (!allObjectsUploaded) {
    return res.status(500).json({ message: "Failed to upload image" });
  }
  const imageUrl = `https://${process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/blog-images/${uploadedObjectNames[0]}`;
  res.status(200).json({ url: imageUrl });
});

module.exports = {
  listBlogsHandler,
  getBlogByIdHandler,
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  publishBlogHandler,
  uploadBlogImageHandler,
};
