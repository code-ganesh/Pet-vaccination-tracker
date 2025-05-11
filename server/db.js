const mysql = require('mysql2');
require('dotenv').config(); // Load .env variables

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

const db = mysql.createPool({
  host: process.env.DB_HOST,      // Database host
  user: process.env.DB_USER,      // Database username
  password: process.env.DB_PASSWORD,  // Database password
  database: process.env.DB_NAME,  // Database name
  waitForConnections: true,       // Manage connections
  connectionLimit: 10,            // Maximum number of connections
  queueLimit: 0                   // No limit on request queue
});

// Test the database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to the database');
  connection.release(); // Release the connection back to the pool
});

module.exports = db;
