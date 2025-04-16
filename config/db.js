const { Pool } = require('pg');
require('dotenv').config();

// Connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection to be established
  maxUses: 7500, // Maximum number of times a client can be used before being closed
  keepAlive: true, // Enable keep-alive
  keepAliveInitialDelayMillis: 10000, // Initial delay before keep-alive starts
});

// Error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Successfully connected to the database');
  } catch (err) {
    console.error('Error connecting to the database:', err);
    // Don't exit the process, let the application handle the error
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Test connection on startup
testConnection();

// Reconnect function
const reconnect = async () => {
  try {
    await testConnection();
  } catch (err) {
    console.error('Reconnection failed:', err);
    // Retry after 5 seconds
    setTimeout(reconnect, 5000);
  }
};

// Handle connection termination
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Client error:', err);
    reconnect();
  });
});

module.exports = { pool, reconnect };
