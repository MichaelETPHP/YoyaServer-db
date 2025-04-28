const mysql = require('mysql2/promise');

// Load MySQL credentials from environment variables
const dbConfig = {
  host: process.env.MYSQL_ADDON_HOST || 'bv4nrmkvxh2cw24s5wwv-mysql.services.clever-cloud.com',
  port: process.env.MYSQL_ADDON_PORT || 3306,
  user: process.env.MYSQL_ADDON_USER || 'uhl1gxcqhendkqpp',
  password: process.env.MYSQL_ADDON_PASSWORD || 'b7yxfkB2viGbegsUcy52',
  database: process.env.MYSQL_ADDON_DB || 'bv4nrmkvxh2cw24s5wwv',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};