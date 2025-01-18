const LATEST_MESSAGE_PROJECTION_IN_CHAT = {
  senderId: 1,
  content: 1,
  readByReceiver: 1,
};
const USER_PROFILE_PROJECTION_IN_CHAT = {
  userId: 1,
  username: 1,
  profilePic: 1,
};
const USER_PROFILE_PROJECTION = {
  userId: 1,
  username: 1,
  profilePic: 1,
  emailId: 1,
  persona: 1,
  gender: 1,
  phoneNumber: 1,
  dateOfBirth: 1,
};

const USER_PROFILE_PROJECTION_IN_SEARCH_BAR = {
  userId: 1,
  username: 1,
  profilePic: 1,
  emailId: 1,
};

const USER_PROFILE_PROJECTION_IN_TRIP_MEMBERS = {
  userId: 1,
  username: 1,
  profilePic: 1,
  emailId: 1,
};

module.exports = {
  LATEST_MESSAGE_PROJECTION_IN_CHAT,
  USER_PROFILE_PROJECTION_IN_CHAT,
  USER_PROFILE_PROJECTION,
  USER_PROFILE_PROJECTION_IN_SEARCH_BAR,
  USER_PROFILE_PROJECTION_IN_TRIP_MEMBERS
};
