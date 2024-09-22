const DeletedUser = require("../models/DeletedUserModel");

async function create(user) {
  try {
    logger.info(`Request received for storing data of deleted user, user=${user}`)
    const deletedUser = new DeletedUser(user);
    deletedUser.save();
  } catch (error) {
    logger.error(`Error occurred while deleting trips for user with userId=${user}`)
    throw new Error(`Error deleting trips for user=${user}, error=$${error}`);
  }
}

module.exports = { create };
