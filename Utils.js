const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^(\+91)?[0-9]{10}$/;
const crypto = require("crypto");
const { ValidationError } = require("./exceptions/ValidationError");
const logger = require("./logger");
const sharp = require("sharp");

function isValidEmail(emailId) {
  try {
    logger.debug(`Validating email: emailId=${emailId}`);
    
    if (!emailId || typeof emailId !== "string") {
      logger.warn(`Invalid email validation: emailId=${emailId}, type=${typeof emailId}`);
      throw new ValidationError("Invalid email: emailId can't be empty or null");
    }

    if (!emailRegex.test(emailId)) {
      logger.warn(`Email format validation failed: emailId=${emailId}`);
      throw new ValidationError(`Invalid email=${emailId}`);
    }
    
    logger.debug(`Email validation successful: emailId=${emailId}`);
    return true;
  } catch (error) {
    logger.error(`Email validation error: emailId=${emailId}, error=${error.message}`);
    throw error;
  }
}

function isValidPhoneNumber(phoneNumber) {
  try {
    logger.debug(`Validating phone number: phoneNumber=${phoneNumber}`);
    
    if (phoneNumber && phoneNumberRegex.test(phoneNumber)) {
      logger.debug(`Phone number validation successful: phoneNumber=${phoneNumber}`);
      return true;
    } else {
      logger.warn(`Phone number validation failed: phoneNumber=${phoneNumber}`);
      throw new ValidationError(`Invalid phoneNumber=${phoneNumber}`);
    }
  } catch (error) {
    logger.error(`Phone number validation error: phoneNumber=${phoneNumber}, error=${error.message}`);
    throw error;
  }
}

function isPhoneNumberOrEmail(userKey) {
  try {
    logger.debug(`Validating user key: userKey=${userKey}`);
    
    if (phoneNumberRegex.test(userKey)) {
      logger.debug(`User key identified as phone number: userKey=${userKey}`);
      return { isPhoneNumber: true, isEmail: false };
    } else if (emailRegex.test(userKey)) {
      logger.debug(`User key identified as email: userKey=${userKey}`);
      return { isPhoneNumber: false, isEmail: true };
    }
    
    logger.warn(`User key validation failed: userKey=${userKey}`);
    throw new ValidationError(`Invalid UserKey=${userKey}`);
  } catch (error) {
    logger.error(`User key validation error: userKey=${userKey}, error=${error.message}`);
    throw error;
  }
}

const randomFileName = (fileName, bytes = 32) => {
  const randomName = crypto.randomBytes(bytes).toString("hex") + fileName;
  logger.debug(`Generated random filename: original=${fileName}, random=${randomName}`);
  return randomName;
};

function dateFromDateString(dateString) {
  try {
    logger.debug(`Converting date string to Date object: dateString=${dateString}`);

    if (!dateString) {
      logger.warn(`Empty date string provided to dateFromDateString`);
      return null;
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      logger.warn(`Invalid date string provided to dateFromDateString: dateString=${dateString}`);
      return null;
    }

    logger.debug(`Successfully converted date string: dateString=${dateString}, result=${date.toISOString()}`);
    return date;
  } catch (error) {
    logger.error(`Failed to convert date string: dateString=${dateString}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    return null;
  }
}

const parseLimitAndOffset = (limit, offset, defaultLimit) => {
  try {
    logger.debug(`Parsing limit and offset: limit=${limit}, offset=${offset}, defaultLimit=${defaultLimit}`);
    
    const parsedOffset = parseInt(offset, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;
    const limitNumber =
      isNaN(parsedLimit) || parsedLimit < 0
        ? defaultLimit
        : parsedLimit;

    const newOffset = skip + limitNumber;
    const result = { skip, limitNumber, newOffset };
    
    logger.debug(`Parsed limit and offset: skip=${skip}, limitNumber=${limitNumber}, newOffset=${newOffset}`);
    return result;
  } catch (error) {
    logger.error(`Failed to parse limit and offset: limit=${limit}, offset=${offset}, defaultLimit=${defaultLimit}, error=${error.message}`);
    throw error;
  }
};

async function cropAndResizeImages(files) {
  try {
    logger.debug(`Processing image crop and resize: files count=${files?.length || 0}`);
    
    if(!files){
      logger.debug(`No files provided for crop and resize`);
      return null;
    }
    
    const processedFiles = await Promise.all(
      files.map(async (file, index) => {
        logger.debug(`Processing file ${index + 1}/${files.length}: filename=${file.originalname}, size=${file.buffer?.length || 0}`);
        
        const image = sharp(file.buffer).rotate();

        const metadata = await image.metadata();
        let width = metadata.width;
        let height = metadata.height;

        const targetAspectRatio = 4 / 3;

        if (width / height > targetAspectRatio) {
          const newWidth = Math.floor(height * targetAspectRatio);
          const cropOffsetX = Math.floor((width - newWidth) / 2);
          image.extract({ left: cropOffsetX, top: 0, width: newWidth, height });
          logger.debug(`Cropped image horizontally: filename=${file.originalname}, originalSize=${width}x${height}, newSize=${newWidth}x${height}`);
        } else {
          const newHeight = Math.floor(width / targetAspectRatio);
          const cropOffsetY = Math.floor((height - newHeight) / 2);
          image.extract({ left: 0, top: cropOffsetY, width, height: newHeight });
          logger.debug(`Cropped image vertically: filename=${file.originalname}, originalSize=${width}x${height}, newSize=${width}x${newHeight}`);
        }

        const processedBuffer = await image.toBuffer();
        logger.debug(`Successfully processed file: filename=${file.originalname}, originalSize=${file.buffer.length}, processedSize=${processedBuffer.length}`);
        
        return {
          originalname: file.originalname,
          buffer: processedBuffer,
          mimetype: file.mimetype,
        };
      })
    );
    
    logger.debug(`Successfully processed ${processedFiles.length} images`);
    return processedFiles;
  } catch (error) {
    logger.error(`Failed to crop and resize images: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = {
  isValidEmail,
  randomFileName,
  dateFromDateString,
  isValidPhoneNumber,
  parseLimitAndOffset,
  cropAndResizeImages,
  isPhoneNumberOrEmail
};
