// utils/responseUtils.js

const sendResponse = (
  res,
  status,
  message,
  statusCode,
  data = null,
  errorDetails = null
) => {
  const response = {
    status,
    message,
    statusCode,
    data,
    errorDetails,
    metadata: {
      timestamp: new Date().toISOString(),
      action: res.locals.action || "API Request",
    },
  };

  if (status === "error" && !errorDetails) {
    response.errorDetails = {
      code: "UNKNOWN_ERROR",
      description: "An unknown error occurred",
    };
  }

  return res.status(statusCode).json(response);
};

module.exports = sendResponse;
