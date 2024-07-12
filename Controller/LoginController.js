const express = require("express");
const router = express.Router();
const jsonParser = require("body-parser").json();
const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForUserProfiles = process.env.COLLECTION_FOR_USER_PROFILES;
const { MongoClient } = require("mongodb");
const client = new MongoClient(urlForMongoDB);
const bcrypt = require("bcrypt");
const passport = require("passport");
const nodemailer = require("nodemailer");
const Recipient = require("mailersend").Recipient;
const EmailParams = require("mailersend").EmailParams;
const MailerSend = require("mailersend");
const UserProfile = require("../models/UserProfile");

const {getUserById} = require("../Utils");
// const {createUser} = require("./UserController")

const fetch = require("node-fetch");
async function addUserToDataBase(user, collectionName) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const userAdded = await collection.insertOne(user);
    return userAdded;
  } finally {
    await client.close();
  }
}

async function getUserProfileByEmailId(emailId, collectionName) {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const result = await collection.findOne({ emailId: emailId });
    return result;
  } finally {
    await client.close();
  }
}

async function updateUserPassword(
  userEmail,
  hashedPassword,
  collectionName
) {
  try{
    await client.connect();
    console.log(collectionName);
    const database = client.db(databaseName);
    database.collection(collectionName).updateOne(
      { "emailId": userEmail}, // Filter: Match document with this _id
      { $set: { password: hashedPassword } }, // Update: Set the username to a new value
      (err, result) => {
        if (err) {
          console.error("Error updating user:", err);
          return;
        }
        console.log("User update");
        client.close(); // Close the connection after update
      }
    );
  }

  catch(error){
    console.log(error);
  }
}

// async function createUserProfile(user) {
//   try {
//     await client.connect();
//     const database = client.db(databaseName);
//     const collection = database.collection("users");
//     const userCreated = await collection.insertOne(user);
//     return userCreated;
//   } finally {
//     await client.close();
//   }
// }

async function getUserDataFromGoogle(accessToken) {
  try {
    const url =
      "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos";
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

router.post("/googleLogin", jsonParser, async (req, res) => {
  const { token } = req.body;
  console.log("hello");

  try {
    // Fetch user data from Google
    const userData = await getUserDataFromGoogle(token);

    console.log("the code came here");

    // Extract user information
    const { emailAddresses, names, photos } = userData;
    const userEmail = emailAddresses[0].value;
    const userName = names[0].displayName;
    const profileImageUrl = photos && photos.length > 0 ? photos[0].url : null;

   


    var currentUser = await getUserProfileByEmailId(
      userEmail, "userProfiles"
    );

    if (!currentUser) {
      await addUserToDataBase(new UserProfile({
        username: "",
        password: "",
        emailId: userEmail
      }), "userProfiles");
    }

    currentUser = await getUserProfileByEmailId(
      userEmail, "userProfiles"
    );

    console.log("now the user is" , currentUser);

    const currentUserId = currentUser._id;
    // Example processing of userData and profile image URL
    req.session.user = { id:currentUserId.toString() };
    console.log("the session value is", req.session);

    let {_id , username , profilePic , emailId} = currentUser;
  
    // Respond with success
    const userValuesToBeReturned = {_id , username,  profilePic, emailId }
    console.log(userValuesToBeReturned);
    res
      .status(200)
      .json({ success: true, message: "Google login successful.", user: userValuesToBeReturned});
    console.log("the session id is", req.sessionID);
  } catch (error) {
    console.error("Google login failed:", error.message);
    res.status(401).json({
      success: false,
      message: "Failed to verify Google token or fetch user data.",
      user:null
    });
  }
});

router.get("/checkSession", jsonParser, async (req, res) => {
  console.log("the req.session is", req.session);
  if (req.session.user) {
    const user = await getUserById(req.session.user.id);
    console.log(user);
    let {_id , username , profilePic , emailId} = user;
  
    // Respond with success
    const userValuesToBeReturned = {_id , username,  profilePic, emailId }
    console.log("checking the session and user is", user);
    res.status(200).json({ loggedIn: true, user:userValuesToBeReturned});
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

router.post("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).json({ success: false, message: "Error logging out" });
    } else {
      res.clearCookie("connect.sid"); // Clear the session cookie
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
    }
  });
});



router.post("/signUp", jsonParser, async (req, res) => {
  try{
    const { userEmail, password } = req.body;
    const currentUser = await getUserProfileByEmailId(
      userEmail,
      "userProfiles"
    );
    const hashedPassword = await bcrypt.hash(password, 10);
    if (currentUser) {
      res.status(400).json({success: false, message: "email aready exist"});
      return;
    }
    await addUserToDataBase(new UserProfile(
      { 
        username: "",
        isGoogleSignUp: false,
        emailId: userEmail, 
        password: hashedPassword,
        }
  ));
    res.status(201).json({success: true, message: "Account Created"});
  }

  catch(error){
    res.status(500).json({success: false, message: "Internal Server Error"});
  }
  
});

router.post("/", jsonParser, async (req, res) => {
  const { userEmail, password , rememberMe} = req.body;
  const currentUser = await getUserProfileByEmailId(
     userEmail,
    "userProfiles"
  );
  if (!currentUser) {
    res.status(400).json("user doesn't exist");
    return;
  }
  const storedHashPassword = currentUser.password;
  const userId = currentUser._id;
  const {_id , username , profilePic , emailId} = currentUser;
    // Respond with success
    const userValuesToBeReturned = {_id , username,  profilePic, emailId }
    console.log(userValuesToBeReturned);

  bcrypt.compare(password, storedHashPassword, (err, result) => {
    if (err) {
      console.error("Error comparing password:", err);
      res.status(500).json("Internal Server Error");
    }
     else if (result) {
      console.log("Password is valid!");
      req.session.user = {id:userId.toString()};
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } 
      res.status(200).json({message: "Valid user", user:userValuesToBeReturned});
    } else {
      console.log("Invalid password.");
      res.status(400).json({message: "Invalid Password", user:null});
    }
  });
});


function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP
}

async function sendOTP(email, otp){
    const url = 'https://api.mailersend.com/v1/email';
    const data = {
      from: {
        email: 'MS_mTBZtC@trial-0r83ql3y7evgzw1j.mlsender.net'
      },
      to: [
        {
          email: email
        }
      ],
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}`,
      // html: 'Greetings from the team, you got this message through MailerSend.'
    };
  
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': 'Bearer mlsn.8fb8850bd92c2b2951f4b6cb6ce4f9d558aa6ac97ee3e849f4a5d80c81f5a860'
    };
  
    try {
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


router.post("/forgotPassword", jsonParser, async (req, res) => {
  const { userEmail } = req.body;
  const currentUser = await getUserProfileByEmailId(
    userEmail,
    "userProfiles"
  );
  console.log("the request came here", userEmail);
  if (!currentUser) {
    res.status(400).json("user doesn't exist");
    return;
  }
  console.log("hello");
  const otp = generateOTP();
  console.log("the otp is" , otp)
  sendOTP(userEmail, otp);

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection("OTP");
    const existingUser = await collection.findOne({userEmail: userEmail});
    if(existingUser){
      await collection.deleteOne(existingUser);
    }
    const currentUserOtp = {userEmail: userEmail,  OTP: otp}
    await collection.insertOne(currentUserOtp);

  } catch (error) {
    console.log(error);
    res.status(500).json("Can't send OTP");
    return;
  } finally {
    await client.close();
    res.status(200).json("OTP sent");
  }
});

router.post("/verify-reset-password", async (req, res) => {
  const { userEmail, otp, newPassword } = req.body;

  try {
    // Retrieve the stored OTP from your database based on the user's email
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection("OTP");
    const currentOTP = await collection.findOne({ userEmail: userEmail });

    console.log(currentOTP);

    if (!currentOTP) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Compare the OTP from the request with the stored OTP
    if (currentOTP.OTP != otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await updateUserPassword(userEmail, hashedPassword, "userProfiles");

    // If OTP matches, proceed with the next action (e.g., allow password reset)
    // You can clear the OTP after successful verification if it's for one-time use

    // Example: Clear the OTP after successful verification
    await collection.deleteOne(currentOTP);

    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    await client.close();
  }
});


module.exports = router;
