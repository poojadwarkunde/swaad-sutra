const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Storage files
const USERS_FILE = path.join(__dirname, 'users.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Default menu items
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Wheat Chapati', price: 15, unit: 'pc', emoji: '🫓', image: '/images/Chapati.avif', available: true },
  { id: 2, name: 'Puran Poli', price: 25, unit: 'pc', emoji: '🥞', image: '/images/Puran Poli.jpeg', available: true },
  { id: 3, name: 'Jawar Bhakari', price: 20, unit: 'pc', emoji: '🫓', image: '/images/jawar-bhakari.webp', available: true },
  { id: 4, name: 'Bajara Bhakari', price: 20, unit: 'pc', emoji: '🫓', image: '/images/jawar-bhakari.webp', available: true },
  { id: 5, name: 'Kalnyachi Bhakari', price: 25, unit: 'pc', emoji: '🫓', image: '/images/jawar-bhakari.webp', available: true },
  { id: 6, name: 'Methi Paratha', price: 25, unit: 'pc', emoji: '🥙', image: '/images/Methi_Paratha.webp', available: true },
  { id: 7, name: 'Kothimbir Vadi', price: 100, unit: '12pc', emoji: '🌿', image: '/images/kothimbir-vadi.jpg', available: true },
  { id: 8, name: 'Idli Chutney', price: 60, unit: '4pc', emoji: '⚪', image: '/images/Idli-chutney.jpg', available: true },
  { id: 9, name: 'Medu Vada Chutney', price: 60, unit: '4pc', emoji: '🍩', image: '/images/Medu-Vada.jpg', available: true },
  { id: 10, name: 'Pohe', price: 30, unit: 'Plate', emoji: '🍚', image: '/images/pohe.webp', available: true },
  { id: 11, name: 'Upma', price: 30, unit: 'Plate', emoji: '🍲', image: '/images/upma.jpg', available: true },
  { id: 12, name: 'Sabudana Khichadi', price: 50, unit: 'Plate', emoji: '🥣', image: '/images/sabudana-khichdi.jpg', available: true },
  { id: 13, name: 'Appe Chutney', price: 60, unit: '5pc', emoji: '🔵', image: '/images/appe-chutney.webp', available: true },
  { id: 14, name: 'Til Poli', price: 30, unit: 'pc', emoji: '🥮', image: '/images/2-til-gul-poli-Maharashtrian-gulachi-poli-makar-sankrant-special-ladoo-festive-Indian-dessert-puran-poli-viral-video-recipe-trending-rustic-tadka-vegetarian-snacks-lunch-dinner-lohori-1.png', available: true },
  { id: 15, name: 'Sabudana Vada', price: 60, unit: '4pc', emoji: '🥔', image: '/images/sabudana-vada.webp', available: true },
  { id: 16, name: 'Vermicelli Kheer', price: 50, unit: 'Bowl', emoji: '🍮', image: '/images/Seviyan-Kheer.jpg', available: true },
  { id: 17, name: 'Onion Pakoda (Kanda Bhaje)', price: 60, unit: 'Plate', emoji: '🧅', image: '/images/Onion-Pakoda.webp', available: true },
];

// Products storage
function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading products:', err);
  }
  return { products: DEFAULT_PRODUCTS, nextId: 18 };
}

function saveProducts(data) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
}

// Initialize products file if it doesn't exist
if (!fs.existsSync(PRODUCTS_FILE)) {
  saveProducts({ products: DEFAULT_PRODUCTS, nextId: 18 });
  console.log('Created products.json file');
}

// Users storage
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  return { users: [], nextUserId: 1 };
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  saveUsers({ users: [], nextUserId: 1 });
  console.log('Created users.json file');
}

app.use(cors());
app.use(express.json());

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// PRODUCT/MENU ENDPOINTS
// =====================

// GET all products (menu items)
app.get('/api/products', (req, res) => {
  try {
    const { includeHidden } = req.query;
    const data = loadProducts();
    let products = data.products;
    
    // Filter out unavailable products for customers
    if (includeHidden !== 'true') {
      products = products.filter(p => p.available !== false);
    }
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST add new product
app.post('/api/products', (req, res) => {
  try {
    const { name, price, unit, emoji, image } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const data = loadProducts();
    const newProduct = {
      id: data.nextId,
      name: name.trim(),
      price: parseInt(price) || 0,
      unit: unit || 'pc',
      emoji: emoji || '🍽️',
      image: image || '/images/placeholder.jpg',
      available: true
    };
    
    data.products.push(newProduct);
    data.nextId++;
    saveProducts(data);
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, unit, emoji, image, available } = req.body;
    
    const data = loadProducts();
    const productIndex = data.products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Update fields
    if (name !== undefined) data.products[productIndex].name = name;
    if (price !== undefined) data.products[productIndex].price = parseInt(price);
    if (unit !== undefined) data.products[productIndex].unit = unit;
    if (emoji !== undefined) data.products[productIndex].emoji = emoji;
    if (image !== undefined) data.products[productIndex].image = image;
    if (available !== undefined) data.products[productIndex].available = available;
    
    saveProducts(data);
    res.json(data.products[productIndex]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadProducts();
    const productIndex = data.products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    data.products.splice(productIndex, 1);
    saveProducts(data);
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// PUT toggle product availability (quick toggle)
app.put('/api/products/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadProducts();
    const productIndex = data.products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    data.products[productIndex].available = !data.products[productIndex].available;
    saveProducts(data);
    
    res.json(data.products[productIndex]);
  } catch (error) {
    console.error('Error toggling product:', error);
    res.status(500).json({ error: 'Failed to toggle product' });
  }
});

// PUT bulk toggle availability
app.put('/api/products/bulk/toggle', (req, res) => {
  try {
    const { ids, available } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'IDs array is required' });
    }
    
    const data = loadProducts();
    ids.forEach(id => {
      const product = data.products.find(p => p.id === parseInt(id));
      if (product) {
        product.available = available;
      }
    });
    
    saveProducts(data);
    res.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error('Error bulk toggling products:', error);
    res.status(500).json({ error: 'Failed to bulk toggle products' });
  }
});

// =====================
// ORDER ENDPOINTS
// =====================

// GET all orders (sorted by latest first)
app.get('/api/orders', (req, res) => {
  try {
    const orders = db.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST new order
app.post('/api/orders', (req, res) => {
  try {
    const { customerName, flatNumber, items, totalAmount, collectDate, collectTime, notes } = req.body;
    
    if (!customerName || !flatNumber || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const order = db.createOrder({
      customerName,
      flatNumber,
      items,
      totalAmount,
      status: 'NEW',
      paymentStatus: 'PENDING',
      collectDate: collectDate || '',
      collectTime: collectTime || '',
      notes: notes || ''
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT update order (status/paymentStatus)
app.put('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, cancelReason, cancelledAt, adminFeedback, feedbackAt } = req.body;
    
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (cancelReason !== undefined) updates.cancelReason = cancelReason;
    if (cancelledAt) updates.cancelledAt = cancelledAt;
    if (adminFeedback !== undefined) updates.adminFeedback = adminFeedback;
    if (feedbackAt) updates.feedbackAt = feedbackAt;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const order = db.updateOrder(id, updates);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// =====================
// USER ENDPOINTS
// =====================

// Register new user
app.post('/api/users/register', (req, res) => {
  try {
    const { name, mobile } = req.body;
    
    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile are required' });
    }
    
    // Validate mobile (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Mobile must be 10 digits' });
    }
    
    const userData = loadUsers();
    
    // Check if mobile already exists
    const existingUser = userData.users.find(u => u.mobile === mobile);
    if (existingUser) {
      return res.status(400).json({ error: 'Mobile number already registered. Please login.' });
    }
    
    const newUser = {
      id: userData.nextUserId,
      name: name.trim(),
      mobile,
      createdAt: new Date().toISOString()
    };
    
    userData.users.push(newUser);
    userData.nextUserId++;
    saveUsers(userData);
    
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user (by mobile)
app.post('/api/users/login', (req, res) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    
    const userData = loadUsers();
    const user = userData.users.find(u => u.mobile === mobile);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get user by mobile
app.get('/api/users/:mobile', (req, res) => {
  try {
    const { mobile } = req.params;
    const userData = loadUsers();
    const user = userData.users.find(u => u.mobile === mobile);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users (Admin only)
app.get('/api/users', (req, res) => {
  try {
    const userData = loadUsers();
    res.json(userData.users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️  Swaad Sutra API running on http://localhost:${PORT}`);
});
