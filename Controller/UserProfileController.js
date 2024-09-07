const UserProfile = require("../models/UserProfileModel");
const asyncHandler = require("express-async-handler");
const DeletedUser = require("../models/DeletedUserModel");
const TripData = require("../models/TripDataModel");
const logger = require("../logger"); // Import Winston logger

const getUserProfileHandler = asyncHandler(async (req, res) => {
  try {
    logger.info(`Fetching user profile for user ID: ${req.user._id}`);

    res.status(200).json({
      _id: req.user._id,
      name: req.user.username,
      emailId: req.user.emailId,
      phoneNumber: req.user.phoneNumber,
      profilePic: req.user.profilePic,
    });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json();
  }
});

const editUserHandler = asyncHandler(async (req, res) => {
  try {
    const { username, dateOfBirth, persona, phoneNumber, profilePic } =
      req.body;
    const userId = req.user._id;

    logger.info(`Editing user profile for user ID: ${userId}`);

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

    if (!updatedUserProfile) {
      logger.error(`User with ID: ${userId} not found for update`);
      return res.status(404).json();
    }

    logger.info(`User profile updated successfully for user ID: ${userId}`);
    res.status(200).json(updatedUserProfile);
  } catch (err) {
    logger.error(`Error updating user profile: ${err.message}`);
    res.status(500).json();
  }
});

const deleteUserHandler = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    logger.info(`Deleting user profile for user ID: ${userId}`);

    const deletedUser = new DeletedUser({
      userId: req.user._id,
      username: req.user.username,
      email: req.user.emailId,
    });

    await deletedUser.save();
    await UserProfile.findByIdAndDelete(userId);
    await TripData.deleteMany({ userId: userId });

    logger.info(
      `User profile and related trips deleted for user ID: ${userId}`
    );
    res.status(200).json();
  } catch (error) {
    logger.error(`Error deleting user profile: ${error.message}`);
    res.status(500).json();
  }
});

module.exports = { getUserProfileHandler, editUserHandler, deleteUserHandler };
