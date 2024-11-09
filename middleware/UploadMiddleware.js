const multer = require("multer");
const multerStorage = multer.memoryStorage();
const { ValidationError } = require("../exceptions/ValidationError");

const uploadMiddlewareForImages = multer({
  storage: multerStorage,
  limits: {
    fileSize: Number(process.env.LIMIT_ON_SIZE_OF_DESTINATION_IMAGES),
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = process.env.ALLOWED_IMAGE_TYPES.split(",");
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError("Invalid file type, only images are allowed!"),
        false
      );
    }
  },
});

module.exports = { uploadMiddlewareForImages };
