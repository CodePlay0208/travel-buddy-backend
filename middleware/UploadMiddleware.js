const multer = require("multer");
const multerStorage = multer.memoryStorage();
const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");

const uploadMiddlewareForImages = multer({
  storage: multerStorage,
  limits: {
    fileSize: 25 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    logger.debug(`Processing file upload: filename=${file.originalname}, mimetype=${file.mimetype}, size=${file.size}`);
    
    const allowedMimeTypes = process.env.ALLOWED_IMAGE_TYPES.split(",");
    if (allowedMimeTypes.includes(file.mimetype)) {
      logger.debug(`File type validated: filename=${file.originalname}, mimetype=${file.mimetype}`);
      cb(null, true);
    } else {
      logger.warn(`Invalid file type rejected: filename=${file.originalname}, mimetype=${file.mimetype}, allowedTypes=${allowedMimeTypes.join(',')}`);
      cb(
        new ValidationError("Invalid file type, only images are allowed!"),
        false
      );
    }
  },
});

module.exports = { uploadMiddlewareForImages };
