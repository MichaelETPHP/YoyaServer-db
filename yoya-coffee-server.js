// const express = require('express');
// const bodyParser = require('body-parser');
// const path = require('path');
// const cors = require('cors');
// const app = express();
// const PORT = process.env.PORT || 5000;

// // In-memory data storage (for demo purposes)
// let menuItems = [
//   {
//     id: 1,
//     name: 'Cappuccino',
//     description: 'A classic Italian coffee drink prepared with espresso, hot milk, and steamed milk foam.',
//     price: 4.50,
//     formattedPrice: '4.50',
//     categoryId: 1,
//     categoryName: 'Hot Coffee',
//     image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
//     featured: true,
//     likes: 12,
//     dislikes: 2
//   },
//   {
//     id: 2,
//     name: 'Espresso',
//     description: 'A concentrated form of coffee served in small, strong shots.',
//     price: 3.00,
//     formattedPrice: '3.00',
//     categoryId: 3,
//     categoryName: 'Espresso',
//     image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
//     featured: false,
//     likes: 8,
//     dislikes: 1
//   },
//   {
//     id: 3,
//     name: 'Iced Caramel Macchiato',
//     description: 'Espresso combined with vanilla-flavored syrup, milk, ice and caramel sauce.',
//     price: 5.50,
//     formattedPrice: '5.50',
//     categoryId: 2,
//     categoryName: 'Iced Coffee',
//     image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2225&q=80',
//     featured: true,
//     likes: 15,
//     dislikes: 3
//   }
// ];

// let categories = [
//   { id: 1, name: 'Hot Coffee' },
//   { id: 2, name: 'Iced Coffee' },
//   { id: 3, name: 'Espresso' },
//   { id: 4, name: 'Tea' },
//   { id: 5, name: 'TEST' }
// ];

// // User credentials (for demo purposes)
// const users = [
//   { id: 1, username: 'admin', password: 'admin123', isAdmin: true }
// ];

// // Session management (simplified for demo)
// const sessions = {};

// // Middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors());

// // Serve static files from public directory
// app.use(express.static('public'));

// // Simple auth middleware
// const isAuthenticated = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }
  
//   const token = authHeader.split(' ')[1];
//   if (!sessions[token] || Date.now() > sessions[token].expires) {
//     return res.status(401).json({ message: 'Session expired' });
//   }
  
//   req.user = sessions[token].user;
//   next();
// };

// // API Routes

// // Login endpoint
// app.post('/api/login', (req, res) => {
//   const { username, password } = req.body;
  
//   const user = users.find(u => u.username === username && u.password === password);
//   if (!user) {
//     return res.status(401).json({ message: 'Invalid credentials' });
//   }
  
//   // Create a simple session token
//   const token = Math.random().toString(36).substring(2);
//   sessions[token] = {
//     user: { id: user.id, username: user.username, isAdmin: user.isAdmin },
//     expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
//   };
  
//   res.json({ 
//     token,
//     user: { id: user.id, username: user.username, isAdmin: user.isAdmin }
//   });
// });

// // Get current user
// app.get('/api/user', (req, res) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }
  
//   const token = authHeader.split(' ')[1];
//   if (!sessions[token] || Date.now() > sessions[token].expires) {
//     return res.status(401).json({ message: 'Session expired' });
//   }
  
//   res.json(sessions[token].user);
// });

// // Logout endpoint
// app.post('/api/logout', (req, res) => {
//   const authHeader = req.headers.authorization;
//   if (authHeader) {
//     const token = authHeader.split(' ')[1];
//     delete sessions[token];
//   }
  
//   res.json({ message: 'Logged out successfully' });
// });

// // Menu items endpoints
// app.get('/api/menu', (req, res) => {
//   res.json(menuItems);
// });

// app.get('/api/menu/:id', (req, res) => {
//   const id = parseInt(req.params.id);
//   const menuItem = menuItems.find(item => item.id === id);
  
//   if (!menuItem) {
//     return res.status(404).json({ message: 'Menu item not found' });
//   }
  
//   res.json(menuItem);
// });

// // Like a menu item
// app.post('/api/menu/:id/like', (req, res) => {
//   const id = parseInt(req.params.id);
//   const menuItem = menuItems.find(item => item.id === id);
  
//   if (!menuItem) {
//     return res.status(404).json({ message: 'Menu item not found' });
//   }
  
//   // Initialize likes if not present
//   if (menuItem.likes === undefined) {
//     menuItem.likes = 0;
//   }
  
//   // Increment likes count
//   menuItem.likes += 1;
  
//   // Add timestamp for analytics (optional)
//   const likeEvent = {
//     itemId: id,
//     timestamp: new Date(),
//     type: 'like'
//   };
  
//   // For a real app, we would save this to a database
//   console.log('Like event:', likeEvent);
  
//   res.json(menuItem);
// });

// // Dislike a menu item
// app.post('/api/menu/:id/dislike', (req, res) => {
//   const id = parseInt(req.params.id);
//   const menuItem = menuItems.find(item => item.id === id);
  
//   if (!menuItem) {
//     return res.status(404).json({ message: 'Menu item not found' });
//   }
  
//   // Initialize dislikes if not present
//   if (menuItem.dislikes === undefined) {
//     menuItem.dislikes = 0;
//   }
  
//   // Increment dislikes count
//   menuItem.dislikes += 1;
  
//   // Add timestamp for analytics (optional)
//   const dislikeEvent = {
//     itemId: id,
//     timestamp: new Date(),
//     type: 'dislike'
//   };
  
//   // For a real app, we would save this to a database
//   console.log('Dislike event:', dislikeEvent);
  
//   res.json(menuItem);
// });

// // Admin menu management endpoints
// app.post('/api/menu', isAuthenticated, (req, res) => {
//   const { name, description, price, categoryId, image, featured } = req.body;
  
//   // Generate new ID
//   const id = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.id)) + 1 : 1;
  
//   // Get category name
//   const category = categories.find(c => c.id === parseInt(categoryId));
//   const categoryName = category ? category.name : 'Uncategorized';
  
//   // Create new menu item
//   const newItem = {
//     id,
//     name,
//     description,
//     price: parseFloat(price),
//     formattedPrice: parseFloat(price).toFixed(2),
//     categoryId: parseInt(categoryId),
//     categoryName,
//     image,
//     featured: featured || false,
//     likes: 0,
//     dislikes: 0
//   };
  
//   menuItems.push(newItem);
//   res.status(201).json(newItem);
// });

// app.put('/api/menu/:id', isAuthenticated, (req, res) => {
//   const id = parseInt(req.params.id);
//   const { name, description, price, categoryId, image, featured } = req.body;
  
//   const menuItem = menuItems.find(item => item.id === id);
//   if (!menuItem) {
//     return res.status(404).json({ message: 'Menu item not found' });
//   }
  
//   // Get category name
//   const category = categories.find(c => c.id === parseInt(categoryId));
//   const categoryName = category ? category.name : 'Uncategorized';
  
//   // Update menu item
//   menuItem.name = name;
//   menuItem.description = description;
//   menuItem.price = parseFloat(price);
//   menuItem.formattedPrice = parseFloat(price).toFixed(2);
//   menuItem.categoryId = parseInt(categoryId);
//   menuItem.categoryName = categoryName;
//   menuItem.image = image;
//   menuItem.featured = featured || false;
  
//   res.json(menuItem);
// });

// app.delete('/api/menu/:id', isAuthenticated, (req, res) => {
//   const id = parseInt(req.params.id);
//   const index = menuItems.findIndex(item => item.id === id);
  
//   if (index === -1) {
//     return res.status(404).json({ message: 'Menu item not found' });
//   }
  
//   menuItems.splice(index, 1);
//   res.json({ message: 'Menu item deleted successfully' });
// });

// // Categories endpoints
// app.get('/api/categories', (req, res) => {
//   res.json(categories);
// });

// app.post('/api/categories', isAuthenticated, (req, res) => {
//   const { name } = req.body;
  
//   // Generate new ID
//   const id = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
  
//   // Create new category
//   const newCategory = { id, name };
  
//   categories.push(newCategory);
//   res.status(201).json(newCategory);
// });

// app.put('/api/categories/:id', isAuthenticated, (req, res) => {
//   const id = parseInt(req.params.id);
//   const { name } = req.body;
  
//   const category = categories.find(c => c.id === id);
//   if (!category) {
//     return res.status(404).json({ message: 'Category not found' });
//   }
  
//   // Update category
//   category.name = name;
  
//   // Also update category name in menu items
//   menuItems.forEach(item => {
//     if (item.categoryId === id) {
//       item.categoryName = name;
//     }
//   });
  
//   res.json(category);
// });

// app.delete('/api/categories/:id', isAuthenticated, (req, res) => {
//   const id = parseInt(req.params.id);
  
//   // Check if category is used by any menu items
//   const usedByItems = menuItems.some(item => item.categoryId === id);
//   if (usedByItems) {
//     return res.status(400).json({ message: 'Cannot delete category that is used by menu items' });
//   }
  
//   const index = categories.findIndex(c => c.id === id);
//   if (index === -1) {
//     return res.status(404).json({ message: 'Category not found' });
//   }
  
//   categories.splice(index, 1);
//   res.json({ message: 'Category deleted successfully' });
// });

// // Route for admin dashboard
// app.get('/admin', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/admin/index.html'));
// });

// // Catch-all route for client-side routing
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/index.html'));
// });

// // Start server
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Yoya Coffee server running at http://0.0.0.0:${PORT}/`);
// });

// module.exports = app;