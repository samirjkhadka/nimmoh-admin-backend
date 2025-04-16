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
│   └── timeUtils.js          # Inactivity timeout checker
├── logs/
│   └── activity.log          # File-based logs (optional backup)
├── .env                      # Secrets and environment variables
├── .gitignore
├── app.js                    # Express setup, middlewares, routes
├── server.js                 # Server start
├── package.json
└── README.md                 # Project structure and setup docs