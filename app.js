const express = require("express"); // web framework
const cors = require("cors"); // cors middleware
const morgan = require("morgan"); // logging middleware
const helmet = require("helmet"); // security middleware
const rateLimit = require("express-rate-limit"); // rate limiting middleware
const cookieParser = require("cookie-parser"); // cookie parsing middleware
const dotenv = require("dotenv"); // environment variable configuration

const { requestLogger } = require("./middlewares/requestLogger"); // request logging middleware
const { activityLogger } = require("./middlewares/activityLogger"); // activity logging middleware

dotenv.config(); // load environment variables

// routes
const authRoutes = require("./routes/auth.routes"); // auth routes
const adminRoutes = require("./routes/adminRoute"); // admin routes
const userRoutes = require("./routes/userRoute"); // user routes

// create express app
const app = express(); // create express app

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json()); // parse JSON request body
app.use(cookieParser()); // parse cookies
app.use(morgan("dev"));
app.use(requestLogger); // Request logging
app.use(activityLogger); // Activity logging (after routes but before error handling)

app.use(express.urlencoded({ extended: true })); // parse URL-encoded request body

// rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  })
);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// error handling
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

module.exports = app;
