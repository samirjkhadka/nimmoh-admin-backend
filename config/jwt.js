const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || "1d", // already defined
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",
};
