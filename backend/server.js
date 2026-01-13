const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Users storage
const USERS_FILE = path.join(__dirname, 'users.json');

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
