const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const otpRepository = require("../repositories/OtpRepository");
const generateOtpEmail = require("../mailTemplates/otpMail/GenerateOtpEmail");
const { sendTextMessagesToPhoneNumber } = require("../aws/Sns");
const { isPhoneNumberOrEmail } = require("../Utils");

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}

async function sendOTPOnEmail(name, useremail, otp) {
  try {
    logger.info(`Sending otp to user with emailId=${useremail}`);
    const otpString = `${otp}`;
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
    logger.info(`OTP sent successfully to user with emailId=${useremail}`);
  } catch (error) {
    logger.error(
      `Error while sending OTP to user with emailId=${useremail}, error=${error}`
    );
    throw error;
  }
}

async function sendOTPOnPhone(username, phoneNumber, otp){
    try{
        await sendTextMessagesToPhoneNumber(phoneNumber, otp, username);
    }
    catch(error){
        logger.error(`Error while sending otp to user with phoneNumber=${phoneNumber}, error=${error}`);
        throw error;
    }
}
 
async function sendOtp(username, userKey, userId) {
  try {
    const otp = generateOTP();
    const {isPhoneNumber} = isPhoneNumberOrEmail(userKey);
    if(isPhoneNumber){
        await sendOTPOnPhone(username, userKey, otp);
    }
    else{
        await sendOTPOnEmail(username, userKey, otp);
    }
    logger.info(
      `Successfully sent otp=${otp} for user with userId=${userId}, userKey=${userKey}`
    );
    await otpRepository.create(userId, otp, userKey);
  } catch (error) {
    logger.error(
      `Failed to send otp to user with userId=${userId}, error=${error}`
    );
    throw error;
  }
}

module.exports = {
    sendOtp,
};
