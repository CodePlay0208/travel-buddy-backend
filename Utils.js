const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const crypto = require("crypto");

function isValidEmail(emailId) {
  return emailRegex.test(emailId);
}

const randomFileName = (fileName, bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex') + fileName;
}

const dateFromDateString = (date) => {
  try{
    if(date == null || date == undefined){
      return date;
    }
    var queryDate = new Date(date);
    queryDate.setUTCHours(0,0,0,0);
    return queryDate;
  }
  catch(error){
    console.log("error converting date string to date format", error);;
  }
  return null;
}
module.exports = {isValidEmail, randomFileName, dateFromDateString };
