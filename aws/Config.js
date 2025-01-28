const { S3Client } = require("@aws-sdk/client-s3");
const AWS = require("aws-sdk");

const s3Client = new S3Client({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const snsClient = new AWS.SNS({
  region: process.env.SNS_TOPIC_REGION, 
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});



module.exports = { s3Client, snsClient };
