const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");
const DeletedUser = require('../models/DeletedUserModel');
const TripData = require('../models/TripDataModel');


const getUserProfileHandler = asyncHandler(async (req, res) => {
  try {
    res.status(200).json({
        _id: req.user._id,
        name: req.user.username,
        emailId: req.user.emailId,
        phoneNumber: req.user.phoneNumber,
        profilePic: req.user.profilePic
    });
  }
  catch (error) {
    console.log(error);
    res.status(500).json();
  }
});


const editUserHandler = asyncHandler(async (req, res) => {
  try {
    const { username, dateOfBirth, persona, phoneNumber, profilePic } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (username) updateData.username = username;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (persona) updateData.persona = persona;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePic) updateData.profilePic = profilePic;

    const updatedUserProfile = await UserProfile.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-_id -password --createdAt -__v");
    console.log("The updated user profile is", updatedUserProfile);
    res.status(200).json(updatedUserProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});


const deleteUserHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const deletedUser = new DeletedUser({
      userId: req.user._id,
      username: req.user.username,
      email: req.user.emailId,
    });

    await deletedUser.save();
    await UserProfile.findByIdAndDelete(userId);
    await TripData.deleteMany({ userId: userId });
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
});

module.exports = {getUserProfileHandler, editUserHandler, deleteUserHandler};