const asyncHandler = require("express-async-handler");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { s3Client } = require("./Config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomFileName } = require("../Utils");
const logger = require("../Logger");

const uploadObjectToS3Bucket = asyncHandler(async (object, s3Bucket) => {
  try {
    logger.info(`Uploading object=${object} to s3bucket=${s3Bucket}`);
    const uploadedObjectName = randomFileName(object.originalname);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES,
      Key: uploadedObjectName,
      Body: object.buffer,
      ContentType: object.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return uploadedObjectName;
  } catch (error) {
    logger.error(
      `Error while uploading object=${object} to s3bucket=${s3Bucket}, error=${error}`
    );
  }
  return null;
});

const uploadObjectsToS3Bucket = asyncHandler(async (objects, s3Bucket) => {
  var uploadedObjectNames = [];
  var allObjectsUploaded = true;
  logger.info(
    `Uploading objects=${JSON.stringify(objects)} to s3bucket=${s3Bucket}`
  );
  try {
    await Promise.all(
      objects.map(async (object) => {
        const uploadedObjectName = await uploadObjectToS3Bucket(object);
        if (uploadedObjectName == null) {
          allObjectsUploaded = false;
        }
        uploadedObjectNames.push(uploadedObjectName);
      })
    );
  } catch (error) {
    logger.error(
      `Error while uploading objects=${objects} to s3bucket=${s3Bucket}, error=${error}`
    );
  }

  return { uploadedObjectNames, allObjectsUploaded };
});

const getObjectFromS3Bucket = asyncHandler(
  async (uploadedObjectName, s3Bucket) => {
    try {
      logger.info(
        `Fetching object=${uploadedObjectName} from s3bucket=${s3Bucket}`
      );
      const getObjectParams = {
        Bucket: process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES,
        Key: uploadedObjectName,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
      return url;
    } catch (error) {
      logger.error(
        `Error while fetching object=${uploadedObjectName} from s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return null;
  }
);

const getObjectsFromS3Bucket = asyncHandler(
  async (uploadedObjectNames, s3Bucket) => {
    var uploadedObjectUrls = [];
    try {
      logger.info(
        `Fetching objects=${uploadedObjectNames} from s3bucket=${s3Bucket}`
      );
      await Promise.all(
        uploadedObjectNames.map(async (object) => {
          const uploadedFile = await getObjectFromS3Bucket(object);
          if (uploadedFile != null) {
            uploadedObjectUrls.push(uploadedFile);
          }
        })
      );
    } catch (error) {
      logger.error(
        `Error while fetching objects=${uploadedObjectNames} from s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return uploadedObjectUrls;
  }
);

const deleteObjectFromS3Bucket = asyncHandler(
  async (uploadedObjectName, s3Bucket) => {
    try {
      logger.info(
        `Deleting object=${uploadedObjectName} from s3bucket=${s3Bucket}`
      );

      const getObjectParams = {
        Bucket: process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES,
        Key: uploadedObjectName,
      };

      const command = new DeleteObjectCommand(getObjectParams);
      await s3Client.send(command);
      return true;
    } catch (error) {
      logger.error(
        `Error while deleting object=${uploadedObjectName} from s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return false;
  }
);

const deleteObjectsFromS3Bucket = asyncHandler(async (uploadedObjectNames) => {
  var allObjectsDeleted = true;
  try {
    logger.info(
      `Deleting objects=${uploadedObjectNames} from s3bucket=${s3Bucket}`
    );
    await Promise.all(
      uploadedObjectNames.map(async (object) => {
        const isObjectDeleted = await deleteObjectFromS3Bucket(object);
        if (!isObjectDeleted) {
          allObjectsDeleted = false;
        }
      })
    );
  } catch (error) {
    logger.error(
      `Error while deleting object=${uploadedObjectNames} from s3bucket=${s3Bucket}, error=${error}`
    );
  }

  return allObjectsDeleted;
});

module.exports = {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
};
