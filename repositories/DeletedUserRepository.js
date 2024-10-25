const DeletedUser = require("../models/DeletedUserModel");
const logger = require("../Logger");

async function create(user) {
  try {
    logger.info(
      `Request received for storing data of deleted user, user=${JSON.stringify(
        user
      )}`
    );
    const deletedUser = new DeletedUser(user);
    deletedUser.save();
  } catch (error) {
    logger.error(`Error occurred while creating user=${user}`);
    throw new Error(`Error creating user, error=$${error}`);
  }
}

module.exports = { create };
