// const express = require('express');
// const session = require('express-session');
// const bodyParser = require('body-parser');
// const path = require('path');
// const bcrypt = require('bcrypt');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const pg = require('pg');

// // Load environment variables
// dotenv.config();

// // Create Express app
// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors());

// // Session configuration
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'yoya-coffee-secret',
//   resave: false,
//   saveUninitialized: false,
//   cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
// }));

// // Connect to PostgreSQL database
// const pool = new pg.Pool({
//   connectionString: process.env.DATABASE_URL
// });

// // Initialize database
// async function initDb() {
//   try {
//     // Check if tables exist
//     const tablesExist = await pool.query(`
//       SELECT EXISTS (
//         SELECT FROM information_schema.tables 
//         WHERE table_name = 'users'
//       )`
//     );
    
//     if (!tablesExist.rows[0].exists) {
//       console.log('Tables not found, initializing database...');
//       // Run database initialization
//       require('./init-db');
//     }
//   } catch (err) {
//     console.error('Error checking database tables:', err);
//   }
// }

// // Run database initialization
// initDb();

// // Middleware to check if user is authenticated
// const isAuthenticated = (req, res, next) => {
//   if (req.session && req.session.userId) {
//     return next();
//   }
//   res.status(401).json({ message: 'Unauthorized' });
// };

// // Serve static files
// app.use(express.static(path.join(__dirname, '../public')));

// // API Routes

// // Authentication endpoints
// app.post('/api/login', async (req, res) => {
//   const { username, password } = req.body;
  
//   try {
//     // Query the database for user
//     const result = await pool.query(
//       'SELECT * FROM users WHERE username = $1',
//       [username]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
    
//     const user = result.rows[0];
    
//     // Compare password
//     const match = await bcrypt.compare(password, user.password);
    
//     if (!match) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
    
//     // Set session
//     req.session.userId = user.id;
//     req.session.username = user.username;
//     req.session.isAdmin = user.is_admin;
    
//     // Return user info (excluding password)
//     const { password: _, ...userInfo } = user;
//     res.status(200).json(userInfo);
    
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.post('/api/logout', (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.status(500).json({ message: 'Error logging out' });
//     }
//     res.status(200).json({ message: 'Logged out successfully' });
//   });
// });

// app.get('/api/user', (req, res) => {
//   if (req.session && req.session.userId) {
//     res.json({
//       id: req.session.userId,
//       username: req.session.username,
//       isAdmin: req.session.isAdmin
//     });
//   } else {
//     res.status(401).json({ message: 'Unauthorized' });
//   }
// });

// // Menu items endpoints
// app.get('/api/menu', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT m.*, c.name as category_name
//       FROM menu_items m
//       LEFT JOIN categories c ON m.category_id = c.id
//       ORDER BY m.name
//     `);
    
//     // Format prices
//     const menuItems = result.rows.map(item => {
//       return {
//         ...item,
//         formattedPrice: parseFloat(item.price).toFixed(2)
//       };
//     });
    
//     res.json(menuItems);
//   } catch (err) {
//     console.error('Error fetching menu items:', err);
//     res.status(500).json({ message: 'Error fetching menu items' });
//   }
// });

// app.get('/api/menu/:id', async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const result = await pool.query(
//       'SELECT * FROM menu_items WHERE id = $1',
//       [id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }
    
//     const menuItem = {
//       ...result.rows[0],
//       formattedPrice: parseFloat(result.rows[0].price).toFixed(2)
//     };
    
//     res.json(menuItem);
//   } catch (err) {
//     console.error('Error fetching menu item:', err);
//     res.status(500).json({ message: 'Error fetching menu item' });
//   }
// });

// app.post('/api/menu/:id/like', async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const result = await pool.query(
//       'UPDATE menu_items SET likes = likes + 1 WHERE id = $1 RETURNING *',
//       [id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }
    
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error('Error liking menu item:', err);
//     res.status(500).json({ message: 'Error liking menu item' });
//   }
// });

// app.post('/api/menu/:id/dislike', async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const result = await pool.query(
//       'UPDATE menu_items SET dislikes = dislikes + 1 WHERE id = $1 RETURNING *',
//       [id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }
    
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error('Error disliking menu item:', err);
//     res.status(500).json({ message: 'Error disliking menu item' });
//   }
// });

// // Admin menu management endpoints
// app.post('/api/menu', isAuthenticated, async (req, res) => {
//   const { name, description, price, categoryId, image, featured } = req.body;
  
//   try {
//     const result = await pool.query(
//       'INSERT INTO menu_items (name, description, price, category_id, image, featured, likes, dislikes) VALUES ($1, $2, $3, $4, $5, $6, 0, 0) RETURNING *',
//       [name, description, price, categoryId, image, featured || false]
//     );
    
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error('Error creating menu item:', err);
//     res.status(500).json({ message: 'Error creating menu item' });
//   }
// });

// app.put('/api/menu/:id', isAuthenticated, async (req, res) => {
//   const { id } = req.params;
//   const { name, description, price, categoryId, image, featured } = req.body;
  
//   try {
//     const result = await pool.query(
//       'UPDATE menu_items SET name = $1, description = $2, price = $3, category_id = $4, image = $5, featured = $6 WHERE id = $7 RETURNING *',
//       [name, description, price, categoryId, image, featured || false, id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }
    
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error('Error updating menu item:', err);
//     res.status(500).json({ message: 'Error updating menu item' });
//   }
// });

// app.delete('/api/menu/:id', isAuthenticated, async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     const result = await pool.query(
//       'DELETE FROM menu_items WHERE id = $1 RETURNING *',
//       [id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }
    
//     res.json({ message: 'Menu item deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting menu item:', err);
//     res.status(500).json({ message: 'Error deleting menu item' });
//   }
// });

// // Categories endpoints
// app.get('/api/categories', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM categories ORDER BY name');
//     res.json(result.rows);
//   } catch (err) {
//     console.error('Error fetching categories:', err);
//     res.status(500).json({ message: 'Error fetching categories' });
//   }
// });

// app.post('/api/categories', isAuthenticated, async (req, res) => {
//   const { name } = req.body;
  
//   try {
//     const result = await pool.query(
//       'INSERT INTO categories (name) VALUES ($1) RETURNING *',
//       [name]
//     );
    
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error('Error creating category:', err);
//     res.status(500).json({ message: 'Error creating category' });
//   }
// });

// app.put('/api/categories/:id', isAuthenticated, async (req, res) => {
//   const { id } = req.params;
//   const { name } = req.body;
  
//   try {
//     const result = await pool.query(
//       'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
//       [name, id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Category not found' });
//     }
    
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error('Error updating category:', err);
//     res.status(500).json({ message: 'Error updating category' });
//   }
// });

// app.delete('/api/categories/:id', isAuthenticated, async (req, res) => {
//   const { id } = req.params;
  
//   try {
//     // Check if category is used by any menu items
//     const menuItemsResult = await pool.query(
//       'SELECT COUNT(*) FROM menu_items WHERE category_id = $1',
//       [id]
//     );
    
//     if (parseInt(menuItemsResult.rows[0].count) > 0) {
//       return res.status(400).json({ message: 'Cannot delete category that is used by menu items' });
//     }
    
//     const result = await pool.query(
//       'DELETE FROM categories WHERE id = $1 RETURNING *',
//       [id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Category not found' });
//     }
    
//     res.json({ message: 'Category deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting category:', err);
//     res.status(500).json({ message: 'Error deleting category' });
//   }
// });

// // User management endpoints (admin only)
// app.get('/api/users', isAuthenticated, async (req, res) => {
//   // Check if user is admin
//   if (!req.session.isAdmin) {
//     return res.status(403).json({ message: 'Forbidden' });
//   }
  
//   try {
//     const result = await pool.query('SELECT id, username, is_admin, created_at FROM users');
//     res.json(result.rows);
//   } catch (err) {
//     console.error('Error fetching users:', err);
//     res.status(500).json({ message: 'Error fetching users' });
//   }
// });

// app.post('/api/users', isAuthenticated, async (req, res) => {
//   // Check if user is admin
//   if (!req.session.isAdmin) {
//     return res.status(403).json({ message: 'Forbidden' });
//   }
  
//   const { username, password, isAdmin } = req.body;
  
//   try {
//     // Check if username already exists
//     const existingUser = await pool.query(
//       'SELECT * FROM users WHERE username = $1',
//       [username]
//     );
    
//     if (existingUser.rows.length > 0) {
//       return res.status(400).json({ message: 'Username already exists' });
//     }
    
//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
    
//     // Insert new user
//     const result = await pool.query(
//       'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin, created_at',
//       [username, hashedPassword, isAdmin || false]
//     );
    
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error('Error creating user:', err);
//     res.status(500).json({ message: 'Error creating user' });
//   }
// });

// // Catch-all route to serve the main app
// app.get('*', (req, res) => {
//   // Handle admin routes
//   if (req.path.startsWith('/admin')) {
//     return res.sendFile(path.join(__dirname, '../public/admin/index.html'));
//   }
  
//   // Otherwise serve the main index.html
//   res.sendFile(path.join(__dirname, '../public/index.html'));
// });

// // Start server
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Yoya Coffee server running at http://0.0.0.0:${PORT}/`);
// });