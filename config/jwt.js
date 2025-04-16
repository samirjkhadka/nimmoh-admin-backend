// backend/config/envConfig.js

require("dotenv").config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  TOKEN_EXPIRY: "24h", // already defined
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",
  // Add other env vars as needed
};
