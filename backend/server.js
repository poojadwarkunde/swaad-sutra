const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

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
    const { status, paymentStatus } = req.body;
    
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    
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
