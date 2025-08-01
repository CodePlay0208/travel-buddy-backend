const jwt = require("jsonwebtoken");
const logger = require("../logger");

const generateToken = (id, secretKey, expiresIn = "8h") => {
  try {
    logger.debug(`Generating JWT token for id=${id}, expiresIn=${expiresIn}`);
    
    const token = jwt.sign({ id }, secretKey, {
      expiresIn: expiresIn,
    });
    
    logger.debug(`Successfully generated JWT token for id=${id}`);
    return token;
  } catch (error) {
    logger.error(`Failed to generate JWT token for id=${id}: error=${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
};

module.exports = generateToken;
