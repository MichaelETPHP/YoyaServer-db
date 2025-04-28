const bcrypt = require('bcrypt');
const pg = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to PostgreSQL database
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create menu_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image TEXT,
        category_id INTEGER REFERENCES categories(id),
        featured BOOLEAN DEFAULT FALSE,
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if admin user exists
    const adminResult = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (adminResult.rows.length === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, true]
      );
      console.log('Default admin user created');
    }
    
    // Check if we have sample categories
    const categoriesResult = await client.query('SELECT COUNT(*) FROM categories');
    
    if (parseInt(categoriesResult.rows[0].count) === 0) {
      // Add sample categories
      const categories = [
        'Hot Coffee',
        'Iced Coffee',
        'Espresso',
        'Tea',
        'Pastries'
      ];
      
      for (const category of categories) {
        await client.query('INSERT INTO categories (name) VALUES ($1)', [category]);
      }
      console.log('Sample categories created');
    }
    
    // Check if we have sample menu items
    const menuItemsResult = await client.query('SELECT COUNT(*) FROM menu_items');
    
    if (parseInt(menuItemsResult.rows[0].count) === 0) {
      // Get category IDs
      const categoriesResult = await client.query('SELECT * FROM categories');
      const categories = categoriesResult.rows;
      
      // Define sample items
      const sampleItems = [
        {
          name: 'Cappuccino',
          description: 'A classic Italian coffee drink prepared with espresso, hot milk, and steamed milk foam.',
          price: 4.50,
          category: 'Hot Coffee',
          image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
          featured: true
        },
        {
          name: 'Espresso',
          description: 'A concentrated form of coffee served in small, strong shots.',
          price: 3.00,
          category: 'Espresso',
          image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
          featured: false
        },
        {
          name: 'Iced Caramel Macchiato',
          description: 'Espresso combined with vanilla-flavored syrup, milk, ice and caramel sauce.',
          price: 5.50,
          category: 'Iced Coffee',
          image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2225&q=80',
          featured: true
        },
        {
          name: 'Croissant',
          description: 'A buttery, flaky pastry of Austrian origin.',
          price: 3.25,
          category: 'Pastries',
          image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2426&q=80',
          featured: false
        },
        {
          name: 'Green Tea',
          description: 'A type of tea that is made from Camellia sinensis leaves that have not undergone the same withering and oxidation process.',
          price: 3.75,
          category: 'Tea',
          image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
          featured: false
        }
      ];
      
      // Insert sample items
      for (const item of sampleItems) {
        const category = categories.find(c => c.name === item.category);
        
        if (category) {
          await client.query(
            'INSERT INTO menu_items (name, description, price, image, category_id, featured) VALUES ($1, $2, $3, $4, $5, $6)',
            [item.name, item.description, item.price, item.image, category.id, item.featured]
          );
        }
      }
      console.log('Sample menu items created');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Database initialized successfully');
    
  } catch (err) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    // Release client
    client.release();
  }
}

// Run initialization
initDatabase()
  .then(() => {
    console.log('Database setup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
  });