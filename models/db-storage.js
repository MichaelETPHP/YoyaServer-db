const { pool } = require('../config/db');

class DatabaseStorage {
  // Categories
  async getCategories() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    return rows;
  }
  
  async getCategoryById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  }
  
  async createCategory(name) {
    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    const id = result.insertId;
    return { id, name };
  }
  
  async updateCategory(id, name) {
    await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    
    // Update category name in menu items
    await pool.query('UPDATE menu_items SET categoryName = ? WHERE categoryId = ?', [name, id]);
    
    return { id, name };
  }
  
  async deleteCategory(id) {
    // Check if category is used by any menu items
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM menu_items WHERE categoryId = ?', [id]);
    if (rows[0].count > 0) {
      throw new Error('Cannot delete category that is used by menu items');
    }
    
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }
  
  // Menu Items
  async getMenuItems() {
    const [rows] = await pool.query('SELECT * FROM menu_items ORDER BY name');
    return rows;
  }
  
  async getMenuItemsByCategoryId(categoryId) {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE categoryId = ? ORDER BY name', [categoryId]);
    return rows;
  }
  
  async getMenuItemById(id) {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    return rows[0];
  }
  
  async createMenuItem(item) {
    const { name, description, price, categoryId, image, featured } = item;
    
    // Get category name
    const category = await this.getCategoryById(categoryId);
    const categoryName = category ? category.name : 'Uncategorized';
    
    const formattedPrice = parseFloat(price).toFixed(2);
    
    const [result] = await pool.query(
      `INSERT INTO menu_items 
       (name, description, price, formattedPrice, categoryId, categoryName, image, featured, likes, dislikes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, formattedPrice, categoryId, categoryName, image, featured ? 1 : 0, 0, 0]
    );
    
    const id = result.insertId;
    return { 
      id, 
      name, 
      description, 
      price: parseFloat(price), 
      formattedPrice, 
      categoryId: parseInt(categoryId), 
      categoryName, 
      image, 
      featured: !!featured,
      likes: 0,
      dislikes: 0
    };
  }
  
  async updateMenuItem(id, item) {
    const { name, description, price, categoryId, image, featured } = item;
    
    // Get category name
    const category = await this.getCategoryById(categoryId);
    const categoryName = category ? category.name : 'Uncategorized';
    
    const formattedPrice = parseFloat(price).toFixed(2);
    
    await pool.query(
      `UPDATE menu_items SET 
       name = ?, description = ?, price = ?, formattedPrice = ?, 
       categoryId = ?, categoryName = ?, image = ?, featured = ?
       WHERE id = ?`,
      [name, description, price, formattedPrice, categoryId, categoryName, image, featured ? 1 : 0, id]
    );
    
    return await this.getMenuItemById(id);
  }
  
  async deleteMenuItem(id) {
    // Delete related feedback events first
    await pool.query('DELETE FROM feedback_events WHERE itemId = ?', [id]);
    
    // Delete the menu item
    await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);
    return true;
  }
  
  // Like/Dislike functionality
  async likeMenuItem(id) {
    // Record the like event
    await pool.query('INSERT INTO feedback_events (itemId, type) VALUES (?, ?)', [id, 'like']);
    
    // Increment the like count
    await pool.query('UPDATE menu_items SET likes = likes + 1 WHERE id = ?', [id]);
    
    return await this.getMenuItemById(id);
  }
  
  async dislikeMenuItem(id) {
    // Record the dislike event
    await pool.query('INSERT INTO feedback_events (itemId, type) VALUES (?, ?)', [id, 'dislike']);
    
    // Increment the dislike count
    await pool.query('UPDATE menu_items SET dislikes = dislikes + 1 WHERE id = ?', [id]);
    
    return await this.getMenuItemById(id);
  }
  
  // User management
  async getUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }
  
  async getUserById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }
  
  // Session management
  async createSession(token, userId, userData, expiresTimestamp) {
    try {
      const userDataStr = typeof userData === 'string' ? userData : JSON.stringify(userData);
      await pool.query(
        'INSERT INTO sessions (token, userId, expires, userData) VALUES (?, ?, ?, ?)',
        [token, userId, expiresTimestamp, userDataStr]
      );
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }
  
  async getSession(token) {
    try {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE token = ?', [token]);
      if (rows.length === 0) return null;
      
      const session = rows[0];
      
      // Parse the JSON userData if it's a string
      if (session.userData && typeof session.userData === 'string') {
        try {
          session.userData = JSON.parse(session.userData);
        } catch (error) {
          console.error('Error parsing session userData:', error);
          // Fallback to original value if parsing fails
          console.log('Original userData:', session.userData);
        }
      }
      
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }
  
  async deleteSession(token) {
    await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
  }
  
  // Clean up expired sessions
  async cleanUpExpiredSessions() {
    const now = Date.now();
    await pool.query('DELETE FROM sessions WHERE expires < ?', [now]);
  }
}

// Create and export a single instance
const storage = new DatabaseStorage();
module.exports = storage;