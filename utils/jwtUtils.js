// utils/generateAccessToken.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET, TOKEN_EXPIRY } = require("../config/jwt");

const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY || "24h" });
};

module.exports = generateAccessToken;
