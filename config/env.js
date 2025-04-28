// Set environment variables for MySQL connection
process.env.MYSQL_ADDON_HOST = process.env.MYSQL_ADDON_HOST || 'bv4nrmkvxh2cw24s5wwv-mysql.services.clever-cloud.com';
process.env.MYSQL_ADDON_DB = process.env.MYSQL_ADDON_DB || 'bv4nrmkvxh2cw24s5wwv';
process.env.MYSQL_ADDON_USER = process.env.MYSQL_ADDON_USER || 'uhl1gxcqhendkqpp';
process.env.MYSQL_ADDON_PORT = process.env.MYSQL_ADDON_PORT || '3306';
process.env.MYSQL_ADDON_PASSWORD = process.env.MYSQL_ADDON_PASSWORD || 'b7yxfkB2viGbegsUcy52';

// Setup additional environment variables
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'yoya-coffee-session-secret';

console.log('Environment variables set for MySQL connection');