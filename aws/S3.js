const asyncHandler = require("express-async-handler");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { s3Client } = require("./Config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomFileName } = require("../Utils");


const uploadObjectToS3Bucket = asyncHandler(async (object) => {
  try {
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
    console.log("Failed uploading to s3 bucket with error", error);
  }

  return null;
});

const uploadObjectsToS3Bucket = asyncHandler(async (objects) => {
  var uploadedObjectNames = [];
  var allObjectsUploaded = true;
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
    console.log("Error uploading objects");
  }

  return { uploadedObjectNames, allObjectsUploaded };
});

const getObjectFromS3Bucket = asyncHandler(async (uploadedObjectName) => {
  try {
    const getObjectParams = {
      Bucket: process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES,
      Key: uploadedObjectName,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
    return url;
  } catch (error) {
    console.log("Error getting object", uploadedObjectName, error);
  }

  return null;
});

const getObjectsFromS3Bucket = asyncHandler(async (uploadedObjectNames) => {
  var uploadedObjectUrls = [];
  try {
    await Promise.all(
      uploadedObjectNames.map(async (object) => {
        const uploadedFile = await getObjectFromS3Bucket(object);
        if (uploadedFile != null) {
          uploadedObjectUrls.push(uploadedFile);
        }
      })
    );
  } catch (error) {
    console.log("Error getting objects");
  }

  return uploadedObjectUrls;
});

const deleteObjectFromS3Bucket = asyncHandler(async (uploadedObjectName) => {
  try {
    const getObjectParams = {
      Bucket: process.env.S3_BUCKET_NAME_FOR_UPLOADING_DESTINATION_IMAGES,
      Key: uploadedObjectName,
    };

    const command = new DeleteObjectCommand(getObjectParams);
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.log("Error getting objects");
  }

  return false;
});

const deleteObjectsFromS3Bucket = asyncHandler(async (uploadedObjectNames) => {
  var allObjectsDeleted = [];
  try {
    await Promise.all(
      uploadedObjectNames.map(async (object) => {
        const isObjectDeleted = await deleteObjectFromS3Bucket(object);
        if (!isObjectDeleted) {
          allObjectsDeleted = false;
        }
      })
    );
  } catch (error) {
    console.log("Error getting objects");
  }

  return allObjectsDeleted;
});

module.exports = {
  uploadObjectsToS3Bucket,
  getObjectsFromS3Bucket,
  deleteObjectsFromS3Bucket,
};
