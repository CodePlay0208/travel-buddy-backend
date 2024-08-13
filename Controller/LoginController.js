const bcrypt = require("bcrypt");
const UserProfile = require("../models/UserProfileModel");
const TempUserSignUp = require("../models/TempUserSignUpModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/GenerateToken");
const OtpSchema = require("../models/OtpModel");
const nodemailer = require('nodemailer');


async function getUserDataFromGoogle(accessToken) {
  try {
    const url = process.env.GOOGLE_API_FOR_FETCHING_USER_DATA;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch user data.");
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch user data:", error.message);
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

async function sendOTP(useremail, otp) {

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST_FOR_SENDING_MAILS,
      port: process.env.SMTP_PORT_FOR_SENDING_MAILS,
      secure: false,
      auth: {
        user: process.env.SMTP_USER_FOR_SENDING_MAILS,
        pass: process.env.SMTP_PASSWORD_FOR_SENDING_MAILS,
      },
    });

    const to = "tusharmoudgil22@gmail.com", subject = "Hello world";
    const htmlContent =
      "<html><head></head><body><p>Hello,</p>This is my first transactional email sent from Brevo.</p></body></html>"

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS,
      to,
      subject,
      htmlContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      }
      else{
        console.log('Email sent:', info);
      }
    });
  }
  catch (error) {
    console.log("error while sending otp", error);
    throw new Error(error);
  }


}

const googleLoginHandler = asyncHandler(async (req, res) => {
  try {

    const { googleToken } = req.body;
    const userData = await getUserDataFromGoogle(googleToken);
    const { emailAddresses, names, photos, birthdays } = userData;

    const userEmail = emailAddresses[0].value;
    const userName = names[0].displayName;
    var userInDatabase = await UserProfile.findOne({ emailId: userEmail });

    if (!userInDatabase) {
      const newUserProfile = new UserProfile({
        username: userName,
        emailId: userEmail
      });
      userInDatabase = await newUserProfile.save();
    }
    const currentUserId = userInDatabase._id;
    res
      .status(200)
      .json({
        success: true,
        token: generateToken(currentUserId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN)
      });
  } catch (error) {
    console.error("Google login failed:", error.message);
    res.status(401).json({
      success: false,
      token: null
    });
  }
});

const isUserLoggedInHandler = asyncHandler(async (req, res) => {
  try {
    res.status(200).json({
      loggedIn: true,
      userDetails: {
        _id: req.user._id,
        name: req.user.username,
        email: req.user.emailId,
      }
    });
  }
  catch (error) {
    console.log(error);
    res.status(500).json({
      loggedIn: false,
      userDetails: null
    });
  }
});

const signUpHandler = asyncHandler(async (req, res) => {
  try {
    const { userEmail, password, userName, phoneNumber } = req.body;
    const userInDatabase = await UserProfile.findOne({
      emailId: userEmail
    });
    console.log("the user in database is", userInDatabase, userEmail, password, userName);
    if (userInDatabase) {
      res.status(400).json({ success: false, message: "email aready exist" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newTempSignedUser = new TempUserSignUp({
      username: userName,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      emailId: userEmail
    });

    await TempUserSignUp.findOneAndDelete({ emailId: userEmail });

    console.log(newTempSignedUser);

    const createdUser = await newTempSignedUser.save();

    console.log("the created user is", createdUser);

    const otp = generateOTP();
    sendOTP(userEmail, otp);
    const newOTP = new OtpSchema({
      userId: createdUser._id,
      otp: otp,
    });

    console.log("the otp is", otp);
    await newOTP.save();

    res.status(201).json({
      success: true,
      token: generateToken(createdUser._id, process.env.JWT_SECRET_KEY_FOR_USER_SIGNUP)
    });
  }
  catch (error) {
    res.status(500).json({ success: false });
  }
});

const otpVerificationHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);
    const { userOtp } = req.body;
    const originalOtp = await OtpSchema.findOne({ userId: userId });
    console.log(originalOtp);
    if (originalOtp && originalOtp.otp == userOtp) {
      const newUser = { ...req.user._doc }
      delete newUser._id;
      console.log("the new user is", newUser);
      const saveUserInPermanentDatabase = new UserProfile(newUser);
      await saveUserInPermanentDatabase.save();
      res.status(200).json("Email verified and Account Created");
    }
    else {
      res.status(400).json("Otp not valid");
    }
  }
  catch (error) {
    console.log("Error while verifying Otp", error);
    res.status(500).json(error);
  }
});

const loginHandler = asyncHandler(async (req, res) => {
  try {
    const { userEmail, password, rememberMe } = req.body;
    const userInDatabase = await UserProfile.findOne({
      emailId: userEmail,
    });

    if (!userInDatabase) {
      res.status(400).json("user doesn't exist");
      return;
    }
    const storedHashPassword = userInDatabase.password;
    const userId = userInDatabase._id;
    const resultOfComparison = await bcrypt.compare(password, storedHashPassword);

    if (resultOfComparison) {
      console.log("Password is valid!");
      let token = null;
      if (rememberMe) {
        token = generateToken(userId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN, "30d");
      }
      else {
        token = generateToken(userId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN);
      }
      res.status(200).json({ message: "Valid user", token: token });
    }
    else {
      throw new Error("Password Not valid");
    }
  }

  catch (error) {
    console.log("the error is", error);
    res.status(500).json("Password not valid")
  }
});

const forgotPasswordHandler = asyncHandler(async (req, res) => {
  try {
    const { userEmail } = req.body;
    const userInDatabase = await UserProfile.findOne({ emailId: userEmail });
    if (!userInDatabase) {
      res.status(400).json("user doesn't exist");
      return;
    }
    const otp = generateOTP();
    sendOTP(userEmail, otp);
    console.log("the otp is", otp);
    const newOTP = new OtpSchema({
      userId: userInDatabase._id,
      otp: otp,
    })
    await newOTP.save();
    res.status(200).json({
      success: true,
      token: generateToken(userInDatabase._id, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN)
    });
  }
  catch (error) {
    res.status(500).json("Internal Server Error");
  }
});

const verifyResetPasswordHandler = asyncHandler(async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const userId = req.user._id;
    const latestOtpInDatabase = await OtpSchema.findOne({ userId: userId }).sort({ createdAt: -1 });;


    console.log(userId);
    console.log(latestOtpInDatabase);

    if (!latestOtpInDatabase) {
      throw new Error("OTP doesn't exist for this userId");
    }
    if (latestOtpInDatabase.otp != otp) {
      throw new Error("OTP not valid");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserProfile.findOneAndUpdate(
      { _id: latestOtpInDatabase._id },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

const resendOtpHandler = asyncHandler(async (req, res) => {

  try {
    const otp = generateOTP();
    sendOTP(req.user.emailId, otp);
    const newOTP = new OtpSchema({
      userId: req.user._id,
      otp: otp,
    });
    await newOTP.save();
    res.status(200).json("Otp Sent");
  }
  catch (error) {
    res.status(500).json("Failed to send Otp");
  }
});


module.exports = {
  googleLoginHandler, isUserLoggedInHandler, signUpHandler,
  loginHandler, forgotPasswordHandler, verifyResetPasswordHandler, otpVerificationHandler, resendOtpHandler
};
