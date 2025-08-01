const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const otpRepository = require("../repositories/OtpRepository");
const generateOtpEmail = require("../mailTemplates/otpMail/GenerateOtpEmail");
const { sendTextMessagesToPhoneNumber } = require("../aws/Sns");
const { isPhoneNumberOrEmail } = require("../Utils");

function generateOTP() {
  try {
    logger.debug(`Generating OTP`);
    const otp = Math.floor(100000 + Math.random() * 900000);
    logger.debug(`Generated OTP: ${otp}`);
    return otp;
  } catch (error) {
    logger.error(`Failed to generate OTP: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function sendOTPOnEmail(name, useremail, otp) {
  try {
    logger.info(`Sending OTP via email to user: name=${name}, emailId=${useremail}`);
    
    const otpString = `${otp}`;
    logger.debug(`Generating email template for OTP: ${otpString}`);
    const htmlContent = generateOtpEmail(name, otpString);
    
    const subject = "Verify Otp";
    const mailingData = {
      sender: {
        name: "travmigoz",
        email: process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS,
      },
      to: [
        {
          email: useremail,
          name: name,
        },
      ],
      subject: subject,
      htmlContent: htmlContent,
    };

    logger.info(`Sending email via API for emailId=${useremail}`);
    const url = process.env.API_FOR_SENDING_MAILS;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": process.env.API_KEY_FOR_SENDING_MAILS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailingData),
    });

    await response.json();
    logger.info(`OTP sent successfully via email to user: name=${name}, emailId=${useremail}`);
  } catch (error) {
    logger.error(`Failed to send OTP via email: name=${name}, emailId=${useremail}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

async function sendOTPOnPhone(username, phoneNumber, otp){
    try{
        logger.info(`Sending OTP via SMS to user: username=${username}, phoneNumber=${phoneNumber}`);
        
        await sendTextMessagesToPhoneNumber(phoneNumber, otp, username);
        
        logger.info(`OTP sent successfully via SMS to user: username=${username}, phoneNumber=${phoneNumber}`);
    }
    catch(error){
        logger.error(`Failed to send OTP via SMS: username=${username}, phoneNumber=${phoneNumber}, error=${error.message}`);
        if (error.stack) {
          logger.error(`Stack trace: ${error.stack}`);
        }
        throw error;
    }
}
 
async function sendOtp(username, userKey, userId) {
  try {
    logger.info(`Starting OTP send process for user: username=${username}, userKey=${userKey}, userId=${userId}`);
    
    logger.debug(`Generating OTP for userId=${userId}`);
    const otp = generateOTP();
    
    logger.info(`Determining user key type for userKey=${userKey}`);
    const {isPhoneNumber} = isPhoneNumberOrEmail(userKey);
    
    if(isPhoneNumber){
        logger.info(`User key identified as phone number, sending OTP via SMS`);
        await sendOTPOnPhone(username, userKey, otp);
    }
    else{
        logger.info(`User key identified as email, sending OTP via email`);
        await sendOTPOnEmail(username, userKey, otp);
    }
    
    logger.info(`Successfully sent OTP=${otp} for user: username=${username}, userId=${userId}, userKey=${userKey}`);
    
    logger.info(`Storing OTP in database for userId=${userId}`);
    await otpRepository.create(userId, otp, userKey);
    logger.info(`Successfully stored OTP in database for userId=${userId}`);
    
    logger.info(`Completed OTP send process for user: username=${username}, userId=${userId}`);
  } catch (error) {
    logger.error(`Failed to send OTP: username=${username}, userId=${userId}, userKey=${userKey}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

module.exports = {
    sendOtp,
};
