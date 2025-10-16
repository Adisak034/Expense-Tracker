const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables from .env file

// MySQL configuration
const pool = mysql.createPool({
  user: process.env.DB_USER || 'root',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker',
  password: process.env.DB_PASSWORD || 'Password123',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create expenses table with user_id foreign key
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('MySQL database tables initialized successfully');
    
    // Check if we need sample data (only if no users exist)
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (parseInt(rows[0].count) === 0) {
      console.log('No users found, database ready for first registration');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    await pool.execute('SELECT NOW()');
    console.log('Connected to MySQL database successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize on startup
testConnection().then(success => {
  if (success) {
    initializeDatabase();
  }
});

module.exports = pool;
