const DeletedUser = require("../models/DeletedUserModel");
const logger = require("../logger");

async function create(user) {
  try {
    logger.info(`Starting create deleted user record for userId=${user?.userId}`);
    
    const deletedUser = new DeletedUser(user);
    await deletedUser.save();
    
    logger.info(`Successfully created deleted user record for userId=${user?.userId}`);
  } catch (error) {
    logger.error(`Failed to create deleted user record: userId=${user?.userId}, error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Error creating deleted user record, error=${error.message}`);
  }
}

module.exports = { create };
