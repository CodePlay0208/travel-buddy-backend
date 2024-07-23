const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");
const { isValidEmail } = require("../Utils");
const DeletedUser = require('../models/DeletedUserModel');
const TripData = require('../models/TripDataModel');

const createUserProfileHandler = asyncHandler(async (req, res) => {
  try {
    const { username, password, emailId } = req.body;

    if (!isValidEmail(emailId)) {
      return res.status(400).json({ message: "Email Id not valid" });
    }
    const userInDatabase = await UserProfile.findOne({ emailId: emailId });
    if (userInDatabase) {
      return res
        .status(400)
        .json({ message: "User with given EmailId already exists" });
    }

    const newUser = new UserProfile({ username, password, emailId });
    await newUser.save();;
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

const getUserProfileHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'Email Id not valid' });
    }
    const userInDatabase = await UserProfile.findOne({ _id: userId });
    if (!userInDatabase) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userInDatabase);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});


const editUserHandler = asyncHandler(async (req, res) => {
  try {
    const { username, age, sex, address } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userInDatabase = await UserProfile.findOne({ _id: userId });

    if (!userInDatabase) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newUserProfile = new UserProfile({
      username, age, sex, address
    });

    await UserProfile.findOneAndUpdate(
      { id: new ObjectId(userId) },
      { $set: newUserProfile },
      { new: true }
    );
  
    res.json({ message: 'User profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const deleteUserHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const userInDatabase = await UserProfile.findById(userId);
    if (!userInDatabase) {
      return res.status(404).json({ message: 'User not found' });
    }
    const deletedUser = new DeletedUser({
      userId: userInDatabase._id,
      username: userInDatabase.username,
      email: userInDatabase.emailId,
    });

    await deletedUser.save();
    await UserProfile.findByIdAndDelete(userId);
    await TripData.deleteMany({ userId: userId });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = {createUserProfileHandler, getUserProfileHandler, editUserHandler, deleteUserHandler};