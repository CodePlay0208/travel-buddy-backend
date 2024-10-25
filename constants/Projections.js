const LATEST_MESSAGE_PROJECTION_IN_CHAT = {
  senderId: 1,
  content: 1,
  readByReceiver: 1,
};
const USER_PROFILE_PROJECTION_IN_CHAT = { userId: 1, username: 1 };

module.exports = {
  LATEST_MESSAGE_PROJECTION_IN_CHAT,
  USER_PROFILE_PROJECTION_IN_CHAT,
};
