const express = require("express");
const router = express.Router();
const jsonParser = require("body-parser").json();
const urlForMongoDB = process.env.URL_FOR_MONGODB;
const databaseName = process.env.DATABASE_NAME;
const collectionForUserProfiles = process.env.COLLECTION_FOR_USER_PROFILES;
const { MongoClient } = require("mongodb");
const client = new MongoClient(urlForMongoDB);

async function fetchUserData(accessToken) {
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

  try {
    // Fetch user data from Google
    const userData = await fetchUserData(token);

    // Extract user information
    const { emailAddresses, names, photos } = userData;
    const userEmail = emailAddresses[0].value;
    const userName = names[0].displayName;
    const profileImageUrl = photos && photos.length > 0 ? photos[0].url : null;

    console.log("the session value is", req.session);

    req.session.user = { userEmail, userName, profileImageUrl };

    // Example processing of userData and profile image URL
    console.log("Received user data:", {
      userEmail,
      userName,
      profileImageUrl,
    });

    const val = req.session.user;
    // Respond with success
    res
      .status(200)
      .json({ success: true, message: "Google login successful." });
    console.log("the session id is", req.sessionID);
  } catch (error) {
    console.error("Google login failed:", error.message);
    res.status(401).json({
      success: false,
      message: "Failed to verify Google token or fetch user data.",
    });
  }
});

router.get("/checkSession", jsonParser, async (req, res) => {
  
  if (req.session.user) {
    res.status(200).json({ loggedIn: true, user: req.session.user });
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

module.exports = router;
