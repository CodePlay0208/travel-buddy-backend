const { ValidationError } = require("../exceptions/ValidationError");
const logger = require("../logger");
const partnersOtpRepository = require("../repositories/PartnersOtpRepository");
const partnersProfileRepository = require("../repositories/PartnersProfileRepository");
const agentDataRepository = require("../repositories/AgentDataRepository");
const { v4: uuidv4 } = require("uuid");
const generateToken = require("../config/GenerateToken");

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}

async function sendOTPHelper(useremail, otp) {
  try {
    logger.info(`Sending otp to user with emailId=${useremail}`);
    const otpString = `Your otp is=${otp}`;
    const htmlContent = `<p>${otpString}</p>`;
    const subject = "Travmigoz partners OTP";
    const mailingData = {
      sender: {
        name: "travmigoz",
        email: process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS,
      },
      to: [
        {
          email: useremail,
          name: "travmigoz",
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

async function login(user, userOtp) {
  try {
    const userId = user.userId;
    const originalOtp = await partnersOtpRepository.findOtpWithUserId(userId);

    if (!originalOtp || originalOtp.otp != userOtp) {
      throw new ValidationError("Otp Verification Failed");
    }

    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_PARTNER_LOGIN
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to verify otp for user with userId=${user?.userId}, error=${error}`
    );
    throw error;
  }
}

async function sendOtp(useremail) {
  try {
    const userInDatabase = await partnersProfileRepository.findUserWithEmailId(
      useremail
    );

    if (!userInDatabase) {
      throw new ValidationError("User Doesn't Exists");
    }
    const userId = userInDatabase.userId;
    const otp = generateOTP();
    await sendOTPHelper(useremail, otp);
    logger.info(
      `Successfully sent otp=${otp} to user with emailId=${useremail}`
    );
    await partnersOtpRepository.create(userId, otp);
    const token = generateToken(
      userId,
      process.env.JWT_SECRET_KEY_FOR_TEMP_FLOW
    );
    return token;
  } catch (error) {
    logger.error(
      `Failed to send otp to user with emailId=${emailId}, error=${error}`
    );
    throw error;
  }
}

async function setAgentData(payload) {
  try {
    const agentDataId = uuidv4();
    const agentData = {
      ...payload,
      agentDataId,
    };

    await agentDataRepository.createAgentData(agentData);
  } catch (error) {
    logger.error(
      `Failed to create agentData=${payload}, error=${error}`
    );
    throw error;
  }
}

async function getAgentsData() {
    try {
      const agentsData = await agentDataRepository.getAgentsData();
      return agentsData;
    } catch (error) {
      logger.error(
        `Failed to fetch agents Data, error=${error}`
      );
      throw error;
    }
  }

module.exports = { sendOtp, login, setAgentData, getAgentsData };
