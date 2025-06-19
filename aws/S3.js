const asyncHandler = require("express-async-handler");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { s3Client } = require("./Config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const logger = require("../logger");

const uploadObjectToS3Bucket = async (path = "", object, s3Bucket) => {
  try {
    logger.info(`Uploading object to s3bucket=${s3Bucket} at path=${path}`);
    const uploadedObjectName = object.originalname;
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
};

const uploadObjectsToS3Bucket = async (path, objects, s3Bucket) => {
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
};

const getObjectFromS3Bucket = async (path, uploadedObjectName, s3Bucket) => {
  try {
    logger.info(`Fetching object from s3bucket=${s3Bucket}, path=${path}`);
    console.log(path + uploadedObjectName)
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
};

const getObjectsFromS3Bucket = async (path, uploadedObjectNames, s3Bucket) => {
  var uploadedObjectUrls = [];
  if (!uploadedObjectNames) {
    return uploadedObjectUrls;
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
          uploadedObjectUrls.push({
            object: object,
            preSignedUrl: uploadedFile,
          });
        }
      })
    );
  } catch (error) {
    logger.error(
      `Error while fetching objects from s3bucket=${s3Bucket}, error=${error}`
    );
  }
  return uploadedObjectUrls;
};

const deleteObjectFromS3Bucket = async (path, uploadedObjectName, s3Bucket) => {
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
};

const deleteObjectsFromS3Bucket = async (
  path,
  uploadedObjectNames,
  s3Bucket
) => {
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
};

const generatePresignedUrl = async (
 requestType,
 params
) => {
  try {
    logger.info(`Generating Presigned Url for params=${JSON.stringify(params)}, requestType=${requestType}`);
    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3000 });
    return url;
  } catch (error) {
    logger.error(
      `Error generating Presigned Url for params=${JSON.stringify(params)}, requestType=${requestType}, error=${error}`
    );
  }

  return allObjectsDeleted;
};

module.exports = {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
  generatePresignedUrl
};
