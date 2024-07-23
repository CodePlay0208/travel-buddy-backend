const bcrypt = require("bcrypt");
const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../config/GenerateToken");
const OtpSchema = require("../models/OtpModel");
const OtpModel = require("../models/OtpModel");


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
    throw error;
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); 
}

async function sendOTP(useremail, otp) {
  try {
    const url = process.env.URL_FOR_SENDING_MAILS;
    const data = {
      from: {
        email: process.env.EMAILID_FOR_SENDING_MAILS
      },
      to: [
        {
          email: useremail
        }
      ],
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}`,
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': 'Bearer ' + process.env.TOKEN_FOR_SENDING_MAILS
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

  } catch (error) {
    console.error('Error sending email:', error);
  }
}

const googleLoginHandler = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;
    // Fetch user data from Google
    const userData = await getUserDataFromGoogle(token);
    // Extract user information
    const { emailAddresses, names } = userData;
    const userEmail = emailAddresses[0].value;
    const userName = names[0].displayName;
    var userInDatabase = await UserProfile.findOne({ emailId: userEmail });
    if (!userInDatabase) {
      const newUserProfile = new UserProfile({
        username: userName,
        password: "",
        emailId: userEmail
      });

      userInDatabase = await newUserProfile.save();
    }
    const currentUserId = userInDatabase._id;
    res
      .status(200)
      .json({ success: true, message: "Google login successful.", token: generateToken(currentUserId) });
  } catch (error) {
    console.error("Google login failed:", error.message);
    res.status(401).json({
      success: false,
      message: "Failed to verify Google token or fetch user data.",
      user: null
    });
  }
});

const isUserLoggedInHandler = asyncHandler(async (req, res) => {
  try {
    res.status(200).json({
      loggedIn: true, userDetails: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      }
    });
  }
  catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
});

const signUpHandler = asyncHandler(async (req, res) => {
  try {
    const { userEmail, password, userName, phoneNumber } = req.body;
    const userInDatabase = await UserProfile.findOne({
      emailId: userEmail
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    if (userInDatabase) {
      res.status(400).json({ success: false, message: "email aready exist" });
      return;
    }

    const newUser = new UserProfile({
      username: userName,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      emailId: userEmail
    })
    const createdUser = await newUser.save();
    res.status(201).json({ success: true, message: "Account Created", token: generateToken(createdUser._id) });
  }

  catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
    bcrypt.compare(password, storedHashPassword, (err, result) => {
      if (err) {
        console.error("Error comparing password:", err);
        throw new Error("Internal Server Error");
      }
      else if (result) {
        console.log("Password is valid!");
        let token = null;
        if (rememberMe) {
          token = generateToken(userId, "30d");
        }
        else {
          token = generateToken(userId);
        }
        res.status(200).json({ message: "Valid user", token: token });
      }
      else {
        throw new Error("Internal Server Error");
      }
    });
  }
  catch (error) {
    res.status(500).json("Internal Server Error")
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
    const newOTP = new OtpSchema({
      userId: userInDatabase._id,
      otp: otp,
    })
    await newOTP.save();
  }
  catch (error) {
    res.status(500).json("Internal Server Error");
  }
});

const verifyResetPasswordHandler = asyncHandler(async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const latestOtpInDatabase = OtpModel.findOne({ _id: req.user._id }).sort({ createdAt: -1 });;

    if (!latestOtpInDatabase) {
      throw new Error("OTP not valid");
    }
    if (latestOtpInDatabase.otp != otp) {
      throw new Error("OTP not valid");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserProfile.findOneAndUpdate(
      { _id: latestOtpInDatabase._id },
      { $set: { password: newPassword } },
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


module.exports = {
  googleLoginHandler, isUserLoggedInHandler, signUpHandler,
  loginHandler, forgotPasswordHandler, verifyResetPasswordHandler
};
