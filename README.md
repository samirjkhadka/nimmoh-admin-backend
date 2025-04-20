# nimmoh-admin-backend
A comprehensive admin panel

nimmoh-backend/
├── config/
│   ├── db.js                 # PostgreSQL (Neon) pool connection
│   ├── jwt.js                # JWT secret & expiry config
│   ├── mail.js               # Nodemailer configuration
│   └── twofa.js              # Google Authenticator setup
├── controllers/
│   ├── auth.controller.js    # Login, Logout, Forgot Password, 2FA verify
│   ├── user.controller.js    # Profile, Change Password, Update Detail
│   └── admin.controller.js   # Admin user management
├── middlewares/
│   ├── auth.js               # JWT and 2FA auth middleware
│   ├── activityLogger.js     # Log user activity
│   ├── requestLogger.js      # Log request & response
│   └── roleAccess.js         # Role-based access check
├── models/
│   ├── user.model.js         # Raw SQL queries for user-related operations
│   └── log.model.js          # Log storage queries
├── routes/
│   ├── auth.routes.js        # Routes for login, 2FA, logout, etc.
│   ├── user.routes.js        # Routes for profile, update, password
│   └── admin.routes.js       # Routes for admin user management
├── utils/
│   ├── emailTemplates.js     # Mail content generators
│   ├── passwordUtils.js      # Password hash/compare utils
│   ├── jwtUtils.js           # JWT sign/verify utils
|   |--- responseUtils.js     # common response   
│   └── timeUtils.js          # Inactivity timeout checker
├── logs/
│   └── activity.log          # File-based logs (optional backup)
├── .env                      # Secrets and environment variables
├── .gitignore
├── app.js                    # Express setup, middlewares, routes
├── server.js                 # Server start
├── package.json
└── README.md                 # Project structure and setup docs

success Response
{
  "status": "success",
  "message": "Password has been changed successfully",
  "statusCode": 200,
  "data": {
    "user": {
      "id": "9748bbdc-b1d6-4a98-85a8-c16ca648beb6",
      "email": "user@example.com",
      "role": "admin",
      "firstLogin": false
    },
    "token": "jwt_token_string_here",
    "metadata": {
      "timestamp": "2025-04-18T15:30:00Z",
      "action": "Password change"
    }
  }
}

Error Response
{
  "status": "error",
  "message": "Invalid token",
  "statusCode": 400,
  "errorDetails": {
    "code": "INVALID_TOKEN",
    "description": "The provided token is not valid or has expired"
  },
  "metadata": {
    "timestamp": "2025-04-18T15:30:00Z",
    "action": "Token validation"
  }
}


Validation/Info Response:
{
  "status": "info",
  "message": "First login detected. Please change your password.",
  "statusCode": 202,
  "metadata": {
    "timestamp": "2025-04-18T15:30:00Z",
    "action": "First login"
  }
}


Request Payload
Maker/checker

{
  "userId": 7,
  "updateType": "change_role",
  "updatePayload": {
    "newRole": "checker"
  }
}
OR
{
  "userId": 5,
  "updateType": "block",
  "updatePayload": {
    "reason": "Violation of policy"
  }
}
