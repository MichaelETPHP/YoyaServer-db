const { pool } = require('./db');

// Create all necessary tables if they don't exist
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);
    
    // Create menu_items table with references to categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        formattedPrice VARCHAR(20),
        categoryId INT,
        categoryName VARCHAR(255),
        image VARCHAR(1000),
        featured BOOLEAN DEFAULT FALSE,
        likes INT DEFAULT 0,
        dislikes INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES categories(id)
      )
    `);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) PRIMARY KEY,
        userId INT NOT NULL,
        expires BIGINT NOT NULL,
        userData JSON,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
    
    // Create feedback_events table for tracking likes/dislikes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        itemId INT NOT NULL,
        type ENUM('like', 'dislike') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (itemId) REFERENCES menu_items(id)
      )
    `);
    
    console.log('Database tables created successfully');
    
    // Check if default data needs to be inserted
    const [categoryRows] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (categoryRows[0].count === 0) {
      await seedInitialData();
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Seed initial data if tables are empty
async function seedInitialData() {
  try {
    // Insert default categories
    const defaultCategories = [
      { name: 'Hot Coffee' },
      { name: 'Iced Coffee' },
      { name: 'Espresso' },
      { name: 'Tea' },
      { name: 'Pastries' }
    ];
    
    const [categoryResult] = await pool.query(
      'INSERT INTO categories (name) VALUES ?',
      [defaultCategories.map(cat => [cat.name])]
    );
    
    // Insert default menu items
    const defaultMenuItems = [
      {
        name: 'Cappuccino',
        description: 'A classic Italian coffee drink prepared with espresso, hot milk, and steamed milk foam.',
        price: 4.50,
        formattedPrice: '4.50',
        categoryId: 1, // Hot Coffee
        categoryName: 'Hot Coffee',
        image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        featured: true,
        likes: 12,
        dislikes: 2
      },
      {
        name: 'Espresso',
        description: 'A concentrated form of coffee served in small, strong shots.',
        price: 3.00,
        formattedPrice: '3.00',
        categoryId: 3, // Espresso
        categoryName: 'Espresso',
        image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        featured: false,
        likes: 8,
        dislikes: 1
      },
      {
        name: 'Iced Caramel Macchiato',
        description: 'Espresso combined with vanilla-flavored syrup, milk, ice and caramel sauce.',
        price: 5.50,
        formattedPrice: '5.50',
        categoryId: 2, // Iced Coffee
        categoryName: 'Iced Coffee',
        image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2225&q=80',
        featured: true,
        likes: 15,
        dislikes: 3
      }
    ];
    
    // Insert menu items
    const menuItemsValues = defaultMenuItems.map(item => [
      item.name,
      item.description,
      item.price,
      item.formattedPrice,
      item.categoryId,
      item.categoryName,
      item.image,
      item.featured ? 1 : 0,
      item.likes,
      item.dislikes
    ]);
    
    await pool.query(
      `INSERT INTO menu_items 
       (name, description, price, formattedPrice, categoryId, categoryName, image, featured, likes, dislikes) 
       VALUES ?`,
      [menuItemsValues]
    );
    
    // Insert default admin user (username: admin, password: admin123)
    const defaultUsers = [
      { username: 'admin', password: 'admin123', isAdmin: true }
    ];
    
    await pool.query(
      'INSERT INTO users (username, password, isAdmin) VALUES ?',
      [defaultUsers.map(user => [user.username, user.password, user.isAdmin ? 1 : 0])]
    );
    
    console.log('Initial data seeded successfully');
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase
};