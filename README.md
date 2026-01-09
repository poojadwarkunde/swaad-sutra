# 🍽️ Swaad Sutra - Society Home Food Ordering

A simple, production-ready food ordering system for home food businesses operating within a residential society.

## Features

- **Menu Page** (`/`): Browse items, add to cart, place orders
- **Admin Dashboard** (`/admin`): View orders, update status, track payments
- Mobile-first design
- No login required for customers
- SQLite database for reliable local storage

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start Backend Server

```bash
npm start
```

Backend runs on `http://localhost:3001`

### 3. Install Frontend Dependencies (new terminal)

```bash
cd frontend
npm install
```

### 4. Start Frontend Dev Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## URLs

- **Customer Menu**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders (sorted by latest) |
| POST | `/api/orders` | Create new order |
| PUT | `/api/orders/:id` | Update order status/payment |
| GET | `/api/health` | Health check |

## Order Object Schema

```json
{
  "id": 1,
  "customerName": "John",
  "flatNumber": "A-101",
  "items": [{"name": "Puran Poli", "qty": 2}],
  "totalAmount": 120,
  "status": "NEW",
  "paymentStatus": "PENDING",
  "notes": "",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Order & Payment Status

**Order Status**: `NEW` → `COOKING` → `DELIVERED`

**Payment Status**: `PENDING` → `PAID`

## 🚀 Deploy to Internet (Share with Anyone)

### Option 1: Deploy to Render.com (Recommended - Free)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/swaad-sutra.git
git push -u origin main
```

2. **Deploy on Render:**
   - Go to https://render.com
   - Sign up (free)
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Render will auto-detect settings from `render.yaml`
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment

3. **Get your public URL:**
   - You'll get a URL like: `https://swaad-sutra.onrender.com`
   - Share this with your society members!

### Option 2: Deploy to Railway.app

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway will auto-deploy

### Option 3: Local Server with PM2

```bash
# Build everything
npm run build

# Install PM2
npm install -g pm2

# Start server
cd backend
pm2 start server.js --name "swaad-sutra"
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend server port |

## Customizing Menu

Edit the `MENU_ITEMS` array in `frontend/src/pages/MenuPage.jsx`:

```javascript
const MENU_ITEMS = [
  { id: 1, name: 'Wheat Chapati', price: 15, unit: 'pc', emoji: '🫓', image: '/images/wheat-chapati.jpg' },
  { id: 2, name: 'Puran Poli', price: 25, unit: 'pc', emoji: '🥞', image: '/images/puran-poli.jpg' },
  // Add more items...
]
```

## Adding Food Images

Place your food item images in `frontend/public/images/` folder.

**Naming convention:**
- `wheat-chapati.jpg`
- `puran-poli.jpg`
- `jawar-bhakari.jpg`
- `bajara-bhakari.jpg`
- `kalnyachi-bhakari.jpg`
- `methi-paratha.jpg`
- `kothimbir-vadi.jpg`
- `idli-chutney.jpg`
- `medu-vada.jpg`
- `pohe.jpg`
- `upma.jpg`
- `sabudana-khichadi.jpg`
- `appe-chutney.jpg`
- `til-poli.jpg`
- `sabudana-vada.jpg`
- `vermicelli-kheer.jpg`
- `onion-pakoda.jpg`

**Supported formats:** JPG, PNG, WebP

If an image is not found, an emoji fallback will be displayed.

## Database

Orders are stored in `backend/orders.db` (SQLite file). 

To reset all orders, simply delete this file and restart the server.

## License

MIT - Free to use for your home food business!
