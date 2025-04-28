// Load environment variables first
require('./config/env')

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const app = express()
const PORT = 3000

// Authentication middleware
const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: 'Unauthorized - No authorization header' })
  }

  const [type, token] = authHeader.split(' ')
  if (type !== 'Bearer' || !token) {
    return res
      .status(401)
      .json({ message: 'Unauthorized - Invalid authorization format' })
  }

  try {
    const session = await dbStorage.getSession(token)
    if (!session || Date.now() > session.expires) {
      if (session) {
        await dbStorage.deleteSession(token)
      }
      return res.status(401).json({ message: 'Session expired' })
    }

    req.user =
      typeof session.userData === 'string'
        ? JSON.parse(session.userData)
        : session.userData

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res
      .status(500)
      .json({ message: 'Internal server error during authentication' })
  }
}

// Database setup (assuming you have a db.js file to handle database connections)
const { testConnection, initializeDatabase } = require('./config/db')
const dbStorage = require('./models/db-storage')

// Body Parser Middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// API Routes
app.get('/api/cors-test', (req, res) => {
  res.json({ message: 'CORS is working!' })
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  try {
    let user = await dbStorage.getUserByUsername(username)

    if (!user && username === 'admin' && password === 'admin123') {
      await dbStorage.createDefaultAdminUser()
      user = await dbStorage.getUserByUsername('admin')
      console.log('Created default admin user')
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = Math.random().toString(36).substring(2)
    const userData = {
      id: user.id,
      username: user.username,
      isAdmin: !!user.isAdmin,
    }
    const expiresTimestamp = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    await dbStorage.createSession(token, user.id, userData, expiresTimestamp)
    res.json({ token, user: userData })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/user', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const session = await dbStorage.getSession(token)

    if (!session || Date.now() > session.expires) {
      if (session) {
        await dbStorage.deleteSession(token)
      }
      return res.status(401).json({ message: 'Session expired' })
    }

    res.json(session.userData)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/logout', async (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1]
      await dbStorage.deleteSession(token)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  res.json({ message: 'Logged out successfully' })
})

app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await dbStorage.getMenuItems()
    res.json(menuItems)
  } catch (error) {
    console.error('Get menu items error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/menu/:id', async (req, res) => {
  try {
    const menuItem = await dbStorage.getMenuItemById(req.params.id)
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' })
    }
    res.json(menuItem)
  } catch (error) {
    console.error('Get menu item error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/menu/:id/dislike', async (req, res) => {
  try {
    const updatedItem = await dbStorage.dislikeMenuItem(req.params.id)
    console.log('Dislike event:', {
      itemId: req.params.id,
      timestamp: new Date(),
      type: 'dislike',
    })
    res.json(updatedItem)
  } catch (error) {
    console.error('Dislike menu item error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/menu', isAuthenticated, async (req, res) => {
  try {
    const newItem = await dbStorage.createMenuItem(req.body)
    res.status(201).json(newItem)
  } catch (error) {
    console.error('Create menu item error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/menu/:id', isAuthenticated, async (req, res) => {
  try {
    const updatedItem = await dbStorage.updateMenuItem(req.params.id, req.body)
    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found' })
    }
    res.json(updatedItem)
  } catch (error) {
    console.error('Update menu item error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/api/menu/:id', isAuthenticated, async (req, res) => {
  try {
    const menuItem = await dbStorage.getMenuItemById(req.params.id)
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' })
    }
    await dbStorage.deleteMenuItem(req.params.id)
    res.json({ message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Delete menu item error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbStorage.getCategories()
    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/categories', isAuthenticated, async (req, res) => {
  try {
    const newCategory = await dbStorage.createCategory(req.body.name)
    res.status(201).json(newCategory)
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/categories/:id', isAuthenticated, async (req, res) => {
  try {
    const updatedCategory = await dbStorage.updateCategory(
      req.params.id,
      req.body.name
    )
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.json(updatedCategory)
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/api/categories/:id', isAuthenticated, async (req, res) => {
  try {
    await dbStorage.deleteCategory(req.params.id)
    res.json({ message: 'Category deleted successfully' })
  } catch (error) {
    if (error.message.includes('Cannot delete category')) {
      return res
        .status(400)
        .json({ message: 'Cannot delete category that is used by menu items' })
    }
    console.error('Delete category error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'))
})

// Example: Route to test Database connection
app.get('/test-db', async (req, res) => {
  try {
    const connectionStatus = await testConnection() // testConnection should return a status or error
    res.status(200).send(connectionStatus)
  } catch (error) {
    res.status(500).send({ message: 'Database connection failed', error })
  }
})

// Listen to requests on the specified port
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yoya Coffee MySQL server running at http://0.0.0.0:${PORT}/`)
})
