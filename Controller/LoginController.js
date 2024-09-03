const bcrypt = require("bcrypt");
const UserProfile = require("../models/UserProfileModel");
const TempUserSignUp = require("../models/TempUserSignUpModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/GenerateToken");
const OtpSchema = require("../models/OtpModel");
<<<<<<< Updated upstream
const nodemailer = require('nodemailer');

=======
// Your main file, e.g., sendEmail.js
const generateOtpEmail = require('../mailTemplates/otpMail/generateOtpEmail');
>>>>>>> Stashed changes

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


async function sendOTP(name, useremail, otp) {
  try {
<<<<<<< Updated upstream
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST_FOR_SENDING_MAILS,
      port: process.env.SMTP_PORT_FOR_SENDING_MAILS,
      secure: false,
      auth: {
        user: process.env.SMTP_USER_FOR_SENDING_MAILS,
        pass: process.env.SMTP_PASSWORD_FOR_SENDING_MAILS,
=======
    console.log(otp);
    console.log(`${otp}`);

    const otpString=`${otp}`;
    const htmlContent = generateOtpEmail(name, useremail,otpString );

    const mailingData = {
      "sender":{  
         "name" : "travmigoz",
         "email":process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS
      },
      "to":[  
        {
            "email":"akshat170902@gmail.com",
            "name":"akshat"
         }
      ],
      "subject":"Hello world",
      "htmlContent": htmlContent
   }

    const url = process.env.API_FOR_SENDING_MAILS;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": process.env.API_KEY_FOR_SENDING_MAILS,
        "Content-Type": "application/json",
>>>>>>> Stashed changes
      },
    });

    const to = useremail, subject = "Hello world";
    const htmlContent =
      `<html><head></head><body><p>Hello,</p>This is my first transactional email sent from Brevo ${otp}.</p></body></html>`;
      const text =  `Your OTP is ${otp}`;

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS_FOR_SENDING_MAILS,
      to,
      subject,
      text,
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

    console.log(response);
  } catch (error) {
    console.log("error while sending otp", error);
    throw new Error(error);
  }


}

const googleLoginHandler = asyncHandler(async (req, res) => {
  try {
    const { googleToken } = req.googleToken;
    const userData = await getUserDataFromGoogle(googleToken);
    const { emailAddresses, names } = userData;

    const userEmail = emailAddresses[0].value;
    const username = names[0].displayName;
    var userInDatabase = await UserProfile.findOne({ emailId: userEmail });

    if (!userInDatabase) {
      const newUserProfile = new UserProfile({
        username: username,
        emailId: userEmail,
      });
      userInDatabase = await newUserProfile.save();
    }
    const currentUserId = userInDatabase._id;
    res.status(200).json({
      token: generateToken(
        currentUserId,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      ),
    });
  } catch (error) {
    console.error("Google login failed:", error.message);
    res.status(500).json({});
  }
});

const signUpHandler = asyncHandler(async (req, res) => {
  try {
    const { userEmail, password, username, phoneNumber } = req.body;
    const userInDatabase = await UserProfile.findOne({
<<<<<<< Updated upstream
      emailId: userEmail
=======
      emailId: useremail,
>>>>>>> Stashed changes
    });

    if (userInDatabase) {
      res.status(400).json();
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newTempSignedUser = new TempUserSignUp({
      username: username,
      password: hashedPassword,
      phoneNumber: phoneNumber,
<<<<<<< Updated upstream
      emailId: userEmail
=======
      emailId: useremail,
>>>>>>> Stashed changes
    });

    await TempUserSignUp.findOneAndDelete({ emailId: userEmail });

    const createdUser = await newTempSignedUser.save();

<<<<<<< Updated upstream
    const otp = generateOTP();
    sendOTP(userEmail, otp);
=======
    const otp =await generateOTP();
    console.log(otp);
    await sendOTP("akshat",useremail, otp);
>>>>>>> Stashed changes
    const newOTP = new OtpSchema({
      userId: createdUser._id,
      otp: otp,
    });
    await newOTP.save();

    res.status(201).json({
      token: generateToken(
        createdUser._id,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      ),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

const signUpOtpVerificationHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);
    const { userOtp } = req.body;
<<<<<<< Updated upstream
    const originalOtp = await OtpSchema.findOne({ userId: userId });
    console.log(originalOtp);
    if (originalOtp && originalOtp.otp == userOtp) {
      const newUser = { ...req.user._doc }
      delete newUser._id;
      const saveUserInPermanentDatabase = new UserProfile(newUser);
      await saveUserInPermanentDatabase.save();
=======
    const originalOtp = await OtpSchema.findOne({ userId: userId }).sort({
      createdAt: -1,
    });
    console.log(originalOtp);
    const { isSignUpRequest } = req.body;
    if (originalOtp && originalOtp.otp == userOtp) {
      if (isSignUpRequest) {
        const newUser = { ...req.user._doc };
        delete newUser._id;
        const saveUserInPermanentDatabase = new UserProfile(newUser);
        await saveUserInPermanentDatabase.save();
      }
>>>>>>> Stashed changes
      res.status(200).json();
    } else {
      res.status(400).json();
    }
  } catch (error) {
    console.log("Error while verifying Otp", error);
    res.status(500).json();
  }
});

const loginHandler = asyncHandler(async (req, res) => {
  try {
    const { userEmail, password, rememberMe } = req.body;
    const userInDatabase = await UserProfile.findOne({
      emailId: userEmail,
    });

    if (!userInDatabase) {
      res.status(400).json();
      return;
    }
    const storedHashPassword = userInDatabase.password;
    const userId = userInDatabase._id;
    const resultOfComparison = await bcrypt.compare(
      password,
      storedHashPassword
    );

    if (resultOfComparison) {
      let token = null;
      if (rememberMe) {
        token = generateToken(
          userId,
          process.env.JWT_SECRET_KEY_FOR_USER_LOGIN,
          "30d"
        );
      } else {
        token = generateToken(
          userId,
          process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
        );
      }
<<<<<<< Updated upstream
      else {
        token = generateToken(userId, process.env.JWT_SECRET_KEY_FOR_USER_LOGIN);
      }
      res.status(200).json({token: token });
    }
    else {
      res.status(200).json();
=======
      res.status(200).json({ token: token });
    } else {
      res.status(400).json();
>>>>>>> Stashed changes
    }
  } catch (error) {
    console.log("the error is", error);
    res.status(500).json();
  }
});

const forgotPasswordHandler = asyncHandler(async (req, res) => {
  try {
    const { userEmail } = req.body;
    const userInDatabase = await UserProfile.findOne({ emailId: userEmail });
    if (!userInDatabase) {
      res.status(400).json();
      return;
    }
    const otp = generateOTP();
    await sendOTP(userEmail, otp);
    const newOTP = new OtpSchema({
      userId: userInDatabase._id,
      otp: otp,
    });
    await newOTP.save();
    res.status(200).json({
      token: generateToken(
        userInDatabase._id,
        process.env.JWT_SECRET_KEY_FOR_USER_LOGIN
      ),
    });
  } catch (error) {
    res.status(500).json();
  }
});

const verifyResetPasswordHandler = asyncHandler(async (req, res) => {
  try {
<<<<<<< Updated upstream
    const { otp, newPassword } = req.body;
=======
    const { newPassword } = req.body;
>>>>>>> Stashed changes
    const userId = req.user._id;
    const latestOtpInDatabase = await OtpSchema.findOne({ userId: userId }).sort({ createdAt: -1 });;

    if (!latestOtpInDatabase) {
      res.status(400).json();
    }
    if (latestOtpInDatabase.otp != otp) {
      res.status(400).json();
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserProfile.findOneAndUpdate(
      { _id: latestOtpInDatabase._id },
      { $set: { password: hashedPassword } },
      { new: true }
    );
<<<<<<< Updated upstream

    res
      .status(200)
      .json();
=======
    console.log(newUser);
    res.status(200).json();
>>>>>>> Stashed changes
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json();
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
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
});

module.exports = {
  googleLoginHandler,
  signUpHandler,
  loginHandler,
  forgotPasswordHandler,
  verifyResetPasswordHandler,
  signUpOtpVerificationHandler,
  resendOtpHandler,
};
