const jwt = require("jsonwebtoken");

const generateToken = (id, secretKey, expiresIn = "8h") => {
  return jwt.sign({ id }, secretKey, {
    expiresIn: expiresIn,
  });
};

module.exports = generateToken;
