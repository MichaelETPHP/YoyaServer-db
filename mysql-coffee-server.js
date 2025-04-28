// Load environment variables first
require('./config/env');

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Database setup
const { testConnection } = require('./config/db');
const { initializeDatabase } = require('./config/setup-db');
const dbStorage = require('./models/db-storage');

// User credentials (for demo purposes)
const sessions = {}; // Will be replaced with database sessions

app.get('/api/cors-test', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

// Middleware
const corsOptions = {
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'Accept'
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory with no-cache headers
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});
app.use(express.static('public'));

// Database initialization middleware
app.use(async (req, res, next) => {
  if (!app.locals.dbInitialized) {
    try {
      // Test database connection
      await testConnection();
      
      // Initialize database tables
      await initializeDatabase();
      
      app.locals.dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
  next();
});

// Enhanced auth middleware
const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized - No authorization header' });
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Unauthorized - Invalid authorization format' });
  }
  
  const token = parts[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }
  
  try {
    // Get session from database
    const session = await dbStorage.getSession(token);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
    
    if (Date.now() > session.expires) {
      // Delete expired session
      try {
        await dbStorage.deleteSession(token);
      } catch (deleteError) {
        console.error('Error deleting expired session:', deleteError);
      }
      return res.status(401).json({ message: 'Session expired' });
    }
    
    // Handle case where userData might not be properly parsed
    if (session.userData && typeof session.userData === 'object') {
      req.user = session.userData;
    } else if (session.userData && typeof session.userData === 'string') {
      try {
        req.user = JSON.parse(session.userData);
      } catch (parseError) {
        console.error('Error parsing user data in session:', parseError);
        return res.status(500).json({ message: 'Error processing session data' });
      }
    } else {
      console.error('Invalid user data in session:', session);
      return res.status(500).json({ message: 'Invalid session data' });
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

// Set proper content type for all API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// API Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if user exists in the database
    let user = await dbStorage.getUserByUsername(username);
    
    // For demo purposes: If this is the first login and admin user doesn't exist, create it
    if (!user && username === 'admin' && password === 'admin123') {
      try {
        // Create default admin user
        await pool.query(
          'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
          ['admin', 'admin123', 1]
        );
        
        // Get the newly created user
        user = await dbStorage.getUserByUsername('admin');
        console.log('Created default admin user');
      } catch (err) {
        // Handle potential race condition if another request created the user
        if (!err.message.includes('Duplicate entry')) {
          throw err;
        }
        // Try to get the user again
        user = await dbStorage.getUserByUsername('admin');
      }
    }
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create a simple session token
    const token = Math.random().toString(36).substring(2);
    const userData = { id: user.id, username: user.username, isAdmin: !!user.isAdmin };
    const expiresTimestamp = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    // Store session in database
    try {
      await dbStorage.createSession(token, user.id, userData, expiresTimestamp);
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      return res.status(500).json({ message: 'Error creating session' });
    }
    
    res.json({ 
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
app.get('/api/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    
    // Get session from database
    const session = await dbStorage.getSession(token);
    
    if (!session || Date.now() > session.expires) {
      if (session) {
        // Delete expired session
        await dbStorage.deleteSession(token);
      }
      return res.status(401).json({ message: 'Session expired' });
    }
    
    res.json(session.userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      await dbStorage.deleteSession(token);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Menu items endpoints
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await dbStorage.getMenuItems();
    res.json(menuItems);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const menuItem = await dbStorage.getMenuItemById(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Like a menu item
app.post('/api/menu/:id/like', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const menuItem = await dbStorage.getMenuItemById(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    const updatedItem = await dbStorage.likeMenuItem(id);
    
    // Log the event
    console.log('Like event:', {
      itemId: id,
      timestamp: new Date(),
      type: 'like'
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Like menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Dislike a menu item
app.post('/api/menu/:id/dislike', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const menuItem = await dbStorage.getMenuItemById(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    const updatedItem = await dbStorage.dislikeMenuItem(id);
    
    // Log the event
    console.log('Dislike event:', {
      itemId: id,
      timestamp: new Date(),
      type: 'dislike'
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Dislike menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin menu management endpoints
app.post('/api/menu', isAuthenticated, async (req, res) => {
  try {
    const { name, description, price, categoryId, image, featured } = req.body;
    
    const newItem = await dbStorage.createMenuItem({
      name,
      description,
      price,
      categoryId: parseInt(categoryId),
      image,
      featured: featured || false
    });
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/menu/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, categoryId, image, featured } = req.body;
    
    const menuItem = await dbStorage.getMenuItemById(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    const updatedItem = await dbStorage.updateMenuItem(id, {
      name,
      description,
      price,
      categoryId: parseInt(categoryId),
      image,
      featured: featured || false
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/menu/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const menuItem = await dbStorage.getMenuItemById(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    await dbStorage.deleteMenuItem(id);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbStorage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/categories', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    const newCategory = await dbStorage.createCategory(name);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/categories/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    
    const category = await dbStorage.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const updatedCategory = await dbStorage.updateCategory(id, name);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    try {
      await dbStorage.deleteCategory(id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      if (error.message.includes('Cannot delete category')) {
        return res.status(400).json({ message: 'Cannot delete category that is used by menu items' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route for admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Periodically clean up expired sessions
setInterval(async () => {
  try {
    await dbStorage.cleanUpExpiredSessions();
    console.log('Cleaned up expired sessions');
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}, 1000 * 60 * 60); // Run every hour

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yoya Coffee MySQL server running at http://0.0.0.0:${PORT}/`);
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;