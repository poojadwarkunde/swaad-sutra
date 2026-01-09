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
    const orders = db.prepare(`
      SELECT * FROM orders ORDER BY createdAt DESC
    `).all();
    
    // Parse items JSON string back to array
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    
    res.json(parsedOrders);
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
    
    const createdAt = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO orders (customerName, flatNumber, items, totalAmount, status, paymentStatus, collectDate, collectTime, notes, createdAt)
      VALUES (?, ?, ?, ?, 'NEW', 'PENDING', ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      customerName,
      flatNumber,
      JSON.stringify(items),
      totalAmount,
      collectDate || '',
      collectTime || '',
      notes || '',
      createdAt
    );
    
    res.status(201).json({
      id: result.lastInsertRowid,
      customerName,
      flatNumber,
      items,
      totalAmount,
      status: 'NEW',
      paymentStatus: 'PENDING',
      collectDate: collectDate || '',
      collectTime: collectTime || '',
      notes: notes || '',
      createdAt
    });
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
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (paymentStatus) {
      updates.push('paymentStatus = ?');
      values.push(paymentStatus);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE orders SET ${updates.join(', ')} WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Fetch updated order
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    
    res.json({
      ...order,
      items: JSON.parse(order.items)
    });
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
