const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const crypto = require("crypto");

function isValidEmail(emailId) {
  return emailRegex.test(emailId);
}

function generateUniqueKey(existingKey){
  let newKey;
  do {
    newKey = crypto.randomBytes(64).toString('hex');
  } while (newKey === existingKey);
  return newKey;
}

const isJwtSecretKeyPresent = (secretKey) => {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    return envContent.includes(secretKey);
  } catch (err) {
    return false;
  }
};

const generateSecretKeys = () => {
  if (!isJwtSecretKeyPresent("JWT_SECRET_KEY_FOR_USER_LOGIN")) {
    const jwtSecretKey = crypto.randomBytes(64).toString('hex');
    fs.appendFileSync(envPath, `JWT_SECRET_KEY_FOR_USER_LOGIN=${jwtSecretKey}\n`);
  }
  
  if (!isJwtSecretKeyPresent("JWT_SECRET_KEY_FOR_USER_SIGNUP")) {
    const jwtSecretKeyForLoginUser = process.env.JWT_SECRET_KEY_FOR_USER_LOGIN;
    const jwtSecretKeyForSignUpUser =  generateUniqueKey(jwtSecretKeyForLoginUser);
    fs.appendFileSync(envPath, `JWT_SECRET_KEY_FOR_USER_SIGNUP=${jwtSecretKeyForSignUpUser}\n`);
  }
}

module.exports = {isValidEmail, generateSecretKeys };
