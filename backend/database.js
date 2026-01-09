const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'orders.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    flatNumber TEXT NOT NULL,
    items TEXT NOT NULL,
    totalAmount INTEGER NOT NULL,
    status TEXT DEFAULT 'NEW',
    paymentStatus TEXT DEFAULT 'PENDING',
    collectDate TEXT,
    collectTime TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL
  )
`);

// Add collectDate and collectTime columns if they don't exist (for existing databases)
try {
  db.exec(`ALTER TABLE orders ADD COLUMN collectDate TEXT`);
} catch (e) { /* column already exists */ }

try {
  db.exec(`ALTER TABLE orders ADD COLUMN collectTime TEXT`);
} catch (e) { /* column already exists */ }

module.exports = db;
