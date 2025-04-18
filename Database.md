Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role_id INTEGER REFERENCES roles(id),
  password TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

permissions
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

role_permissions
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);

admin_users_pending
CREATE TABLE admin_users_pending (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL, -- create, update, block, unblock, change_role, reset_password
  name VARCHAR(100),
  email VARCHAR(150),
  phone VARCHAR(20),
  role_id INTEGER,
  target_user_id INTEGER,
  password TEXT, -- Only for 'create' action
  requested_by INTEGER REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

activity_logs
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  ip_address VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2Fa/Security
CREATE TABLE two_factor_auth (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE
);

Settings (Optional/Future)
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email VARCHAR(150),
  subject VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

