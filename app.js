const express = require("express");
const cors = require("cors");
const { requestLogger } = require("./middlewares/requestLogger");
const { activityLogger } = require("./middlewares/activityLogger");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/adminRoute");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Activity logging (after routes but before error handling)
app.use(activityLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

module.exports = app;
