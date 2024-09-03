const bcrypt = require("bcrypt");
const UserProfile = require("../models/UserProfileModel");
const TempUserSignUp = require("../models/TempUserSignUpModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/GenerateToken");
const OtpSchema = require("../models/OtpModel");
// Your main file, e.g., sendEmail.js
const generateOtpEmail = require('../mailTemplates/otpMail/generateOtpEmail');

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
      },
      body: JSON.stringify(mailingData)
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
    const { useremail, password, username, phoneNumber } = req.body;
    const userInDatabase = await UserProfile.findOne({
      emailId: useremail,
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
      emailId: useremail,
    });

    await TempUserSignUp.findOneAndDelete({ emailId: useremail });

    const createdUser = await newTempSignedUser.save();

    const otp =await generateOTP();
    console.log(otp);
    await sendOTP('akshat',useremail, otp);
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
      res.status(200).json({ token: token });
    } else {
      res.status(400).json();
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
    await sendOTP('akshat',userEmail, otp);
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
    const { newPassword } = req.body;
    const userId = req.user._id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const newUser = await UserProfile.findOneAndUpdate(
      { _id: userId },
      { $set: { password: hashedPassword } },
      { new: true }
    );
    console.log(newUser);
    res.status(200).json();
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
