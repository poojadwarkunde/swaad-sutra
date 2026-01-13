# 🍽️ Swaad Sutra - Society Home Food Ordering

A full-stack web application for ordering homemade food within a residential society. Customers can browse daily menu items, place orders, and collect fresh home-cooked food.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Application Screens](#application-screens)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Library |
| **Vite** | Build tool & dev server |
| **React Router** | Client-side routing |
| **CSS3** | Styling (custom CSS variables, responsive design) |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB Atlas** | Cloud database |
| **Mongoose** | MongoDB ODM |
| **XLSX** | Excel file generation |
| **node-cron** | Scheduled tasks |
| **CORS** | Cross-origin resource sharing |

### Deployment
| Service | Purpose |
|---------|---------|
| **Render** | Hosting (backend + frontend) |
| **MongoDB Atlas** | Database hosting |
| **GitHub** | Version control + Excel reports storage |

---

## ✨ Features

### Customer Features
- 🍳 **Daily Menu** - Browse today's available items
- 🛒 **Shopping Cart** - Add/remove items, adjust quantities
- 📱 **User Registration/Login** - Mobile number based authentication
- 📝 **Order Placement** - Select collection date & time
- 🏠 **Flat-based Delivery** - Order by flat number
- ✅ **Order Confirmation** - Instant order confirmation

### Admin Features
- 📊 **Dashboard** - Today's summary (orders, revenue, collected amount)
- 📋 **Order Management** - View all orders with filters & sorting
- 🔄 **Status Updates** - NEW → COOKING → READY → DELIVERED
- 💳 **Payment Tracking** - Mark orders as PAID/PENDING/REFUNDED
- ❌ **Order Cancellation** - Cancel with reason
- 💬 **Feedback System** - Add admin feedback to orders
- 📱 **Customer Notifications** - Send WhatsApp/SMS updates (auto on status change)
- 🍽️ **Menu Management** - Add/Edit/Delete menu items
- ✅ **Daily Availability** - Toggle items available today
- 🚫 **Bulk Actions** - Show All / Hide All items
- 📥 **Excel Export** - Daily reports & consolidated reports
- 🔄 **Auto GitHub Sync** - Auto-upload reports to GitHub on order changes
- 👨‍🍳 **Kitchen View** - Aggregated items to prepare

### Order Status Flow
```
NEW → COOKING → READY → DELIVERED
  ↓
CANCELLED (with reason)
```

### Payment Status Flow
```
PENDING → PAID
    ↓
  REFUNDED
```

---

## 📱 Application Screens

### 1. Menu Page (`/`)
**Purpose:** Customer-facing daily menu and ordering experience

**Components:**
- Header with logo, title "Today's Menu", login button, cart icon
- Welcome message for logged-in users
- Menu grid showing available items:
  - Item emoji
  - Item image
  - Item name
  - Price with unit (per pc, per plate, etc.)
  - Add to cart button
  - Quantity controls (when item in cart)
- Cart sidebar with:
  - Item list with quantities and units
  - Total amount
  - Collection date picker
  - Collection time picker
  - Checkout button
- Checkout form:
  - Name (auto-filled if logged in)
  - Flat Number
  - Mobile Number
  - Collection Date & Time
  - Special Instructions
  - Place Order button
- Order success confirmation with order details

**Authentication Modal:**
- Login tab (mobile number)
- Register tab (name + mobile number)
- Auto-fill customer details after login

### 2. Admin Page (`/admin`)
**Purpose:** Order management, menu management, kitchen operations

**Tabs:**

#### Orders Tab
- Summary cards (Today's Orders, Total Revenue, Collected Amount)
- Export buttons (Daily Report, All Orders)
- Filter & Sort section:
  - Search (name, flat, item)
  - Status filter
  - Payment filter
  - Date filter
  - Sort options (Newest, Oldest, Amount, Collection Time)
- Order cards showing:
  - Order ID, Customer name, Flat number
  - Phone number
  - Items list with quantities
  - Collection date & time
  - Notes, Cancel reason, Feedback
  - Total amount
  - Status dropdown
  - Payment toggle button
  - Action buttons (Cancel, Feedback, Notify)

#### By Status Tab
- Collapsible sections:
  - 🆕 New Orders
  - 🍳 In Progress (Cooking + Ready)
  - 📦 Delivered - Payment Pending
  - ✅ Completed (Delivered + Paid) - Auto-collapsed
  - ❌ Cancelled

#### Menu Tab
- Header with Add Item, Show All, Hide All buttons
- Search filter
- Toggle to show/hide unavailable items
- Menu item cards showing:
  - Emoji
  - Image
  - Name
  - Price & Unit
  - Availability toggle (green ✓ / red ✗)
  - Edit button
  - Delete button

**Modals:**
- Cancel Order Modal (with reason input)
- Feedback Modal (with feedback text)
- Notify Modal (WhatsApp/SMS preview)
- Edit Item Modal (name, price, unit, emoji, image, availability)
- Add Item Modal

---

## 🗄️ Database Schema

### Orders Collection
```javascript
{
  orderId: Number,          // Auto-increment ID
  customerName: String,
  flatNumber: String,
  phone: String,
  items: [{
    id: Number,
    name: String,
    price: Number,
    qty: Number,
    unit: String
  }],
  totalAmount: Number,
  status: String,           // NEW, COOKING, READY, DELIVERED, CANCELLED
  paymentStatus: String,    // PENDING, PAID, REFUNDED
  collectDate: String,      // YYYY-MM-DD
  collectTime: String,      // HH:MM
  notes: String,
  cancelReason: String,
  cancelledAt: Date,
  adminFeedback: String,
  feedbackAt: Date,
  createdAt: Date
}
```

### Products Collection
```javascript
{
  productId: Number,
  name: String,
  price: Number,
  unit: String,             // pc, plate, bowl, 4pc, 12pc, etc.
  emoji: String,
  image: String,
  available: Boolean        // Available today
}
```

### Users Collection
```javascript
{
  userId: Number,
  name: String,
  mobile: String,           // Unique, 10 digits
  createdAt: Date
}
```

### Counters Collection
```javascript
{
  name: String,             // 'orderId', 'userId', 'productId'
  value: Number
}
```

---

## 🔌 API Endpoints

### Products (Menu)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get available menu items |
| GET | `/api/products?includeHidden=true` | Get all items (admin) |
| POST | `/api/products` | Add new menu item |
| PUT | `/api/products/:id` | Update menu item |
| DELETE | `/api/products/:id` | Delete menu item |
| PUT | `/api/products/:id/toggle` | Toggle availability |
| PUT | `/api/products/bulk/toggle` | Bulk toggle availability |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create new order |
| PUT | `/api/orders/:id` | Update order status/payment |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login user |
| GET | `/api/users` | Get all users (admin) |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/daily` | Download daily Excel report |
| GET | `/api/export/daily?date=2026-01-13` | Download specific date report |
| GET | `/api/export/consolidated` | Download all orders report |
| GET | `/api/export/list` | List all exported files |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + DB status |

---

## 🔐 Environment Variables

### Required for Render
```env
MONGODB_URI=mongodb+srv://swaadsutra:password@cluster0.xxx.mongodb.net/swaadsutra?retryWrites=true&w=majority
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### Optional (defaults provided)
```env
PORT=3001
```

---

## 🚀 Deployment

### Render Configuration
- **Build Command:** 
  ```
  cd frontend && npm install && npm run build && mkdir -p ../backend/public && cp -r dist/* ../backend/public/ && cd ../backend && npm install
  ```
- **Start Command:** `node server.js`
- **Root Directory:** (leave empty)

### Auto-Generated Reports
Reports are automatically generated and uploaded to GitHub:
- On new order creation
- On order status update
- On payment status update
- Daily at 11:59 PM

**Report Files:**
- `reports/SwaadSutra_Daily_YYYY-MM-DD.xlsx`
- `reports/SwaadSutra_Consolidated_YYYY-MM-DD.xlsx`

**Excel Report Contents:**
| Sheet | Data |
|-------|------|
| Daily Orders | All orders for the day |
| Summary | Order counts, revenue, payment stats |
| Items Breakdown | Quantity ordered per item |
| Daily Summary | Day-wise aggregated data |

---

## 📁 Project Structure

```
swaad-sutra/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MenuPage.jsx      # Customer menu page
│   │   │   └── AdminPage.jsx     # Admin dashboard
│   │   ├── App.jsx               # Router setup
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── public/
│   │   └── images/               # Food item images
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── server.js                 # Express server + all APIs
│   ├── exports/                  # Generated Excel files
│   └── package.json
├── reports/                      # Auto-synced Excel reports
├── package.json                  # Root build scripts
├── render.yaml                   # Render deployment config
└── README.md
```

---

## 🍳 Default Menu Items

| Item | Price | Unit |
|------|-------|------|
| Wheat Chapati | ₹15 | pc |
| Puran Poli | ₹25 | pc |
| Jawar Bhakari | ₹20 | pc |
| Bajara Bhakari | ₹20 | pc |
| Kalnyachi Bhakari | ₹25 | pc |
| Methi Paratha | ₹25 | pc |
| Kothimbir Vadi | ₹100 | 12pc |
| Idli Chutney | ₹60 | 4pc |
| Medu Vada Chutney | ₹60 | 4pc |
| Pohe | ₹30 | Plate |
| Upma | ₹30 | Plate |
| Sabudana Khichadi | ₹50 | Plate |
| Appe Chutney | ₹60 | 5pc |
| Til Poli | ₹30 | pc |
| Sabudana Vada | ₹60 | 4pc |
| Vermicelli Kheer | ₹50 | Bowl |
| Onion Pakoda | ₹60 | Plate |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Customer** | Menu page, place orders, view cart |
| **Admin** | `/admin` - Full order & menu management |

---

## 📞 Support

For issues or feature requests, contact the development team.

---

**Built with ❤️ for Swaad Sutra - Bringing homemade goodness to your doorstep**
