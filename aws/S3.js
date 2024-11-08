const asyncHandler = require("express-async-handler");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { s3Client } = require("./Config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomFileName } = require("../Utils");
const logger = require("../logger");

const uploadObjectToS3Bucket = asyncHandler(
  async (path = "", object, s3Bucket) => {
    try {
      logger.info(`Uploading object to s3bucket=${s3Bucket} at path=${path}`);
      const uploadedObjectName = randomFileName(object.originalname);
      const params = {
        Bucket: s3Bucket,
        Key: path + uploadedObjectName,
        Body: object.buffer,
        ContentType: object.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      return uploadedObjectName;
    } catch (error) {
      logger.error(
        `Error while uploading object to s3bucket=${s3Bucket}, error=${error}`
      );
    }
    return null;
  }
);

const uploadObjectsToS3Bucket = asyncHandler(
  async (path, objects, s3Bucket) => {
    var uploadedObjectNames = [];
    var allObjectsUploaded = true;
    if (!objects) {
      return { uploadedObjectNames, allObjectsUploaded };
    }
    try {
      logger.info(`Uploading objects to s3bucket=${s3Bucket} at path=${path}`);
      await Promise.all(
        objects.map(async (object) => {
          const uploadedObjectName = await uploadObjectToS3Bucket(
            path,
            object,
            s3Bucket
          );
          if (uploadedObjectName == null) {
            allObjectsUploaded = false;
          }
          uploadedObjectNames.push(uploadedObjectName);
        })
      );
    } catch (error) {
      logger.error(
        `Error while uploading objects to s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return { uploadedObjectNames, allObjectsUploaded };
  }
);

const getObjectFromS3Bucket = asyncHandler(
  async (path, uploadedObjectName, s3Bucket) => {
    try {
      logger.info(`Fetching object from s3bucket=${s3Bucket}, path=${path}`);
      const getObjectParams = {
        Bucket: s3Bucket,
        Key: path + uploadedObjectName,
      };
      const command = new GetObjectCommand(getObjectParams);
      const headCommand = new HeadObjectCommand(getObjectParams);
      await s3Client.send(headCommand);
      const url = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
      return url;
    } catch (error) {
      logger.error(
        `Error while fetching object from s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return null;
  }
);

const getObjectsFromS3Bucket = asyncHandler(
  async (path, uploadedObjectNames, s3Bucket) => {
    var uploadedObjectUrls = [];
    if (!uploadedObjectNames) {
      return { uploadedObjectUrls, allObjectsUploaded };
    }
    try {
      logger.info(`Fetching objects from s3bucket=${s3Bucket}`);
      await Promise.all(
        uploadedObjectNames.map(async (object) => {
          const uploadedFile = await getObjectFromS3Bucket(
            path,
            object,
            s3Bucket
          );
          if (uploadedFile != null) {
            uploadedObjectUrls.push(uploadedFile);
          }
        })
      );
    } catch (error) {
      logger.error(
        `Error while fetching objects from s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return uploadedObjectUrls;
  }
);

const deleteObjectFromS3Bucket = asyncHandler(
  async (path, uploadedObjectName, s3Bucket) => {
    try {
      logger.info(`Deleting object from s3bucket=${s3Bucket}, path${path}`);

      const getObjectParams = {
        Bucket: s3Bucket,
        Key: path + uploadedObjectName,
      };

      const command = new DeleteObjectCommand(getObjectParams);
      await s3Client.send(command);
      return true;
    } catch (error) {
      logger.error(
        `Error while deleting object from s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return false;
  }
);

const deleteObjectsFromS3Bucket = asyncHandler(
  async (path, uploadedObjectNames, s3Bucket) => {
    var allObjectsDeleted = true;
    if (!uploadedObjectNames) {
      return { allObjectsDeleted };
    }
    try {
      logger.info(`Deleting object from s3bucket=${s3Bucket}`);
      await Promise.all(
        uploadedObjectNames.map(async (object) => {
          const isObjectDeleted = await deleteObjectFromS3Bucket(
            path,
            object,
            s3Bucket
          );
          if (!isObjectDeleted) {
            allObjectsDeleted = false;
          }
        })
      );
    } catch (error) {
      logger.error(
        `Error while deleting object from s3bucket=${s3Bucket}, error=${error}`
      );
    }

    return allObjectsDeleted;
  }
);

module.exports = {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
};
