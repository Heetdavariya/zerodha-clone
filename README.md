# 📈 Zerodha Clone — Full-Stack Trading Platform

A production-ready clone of India's largest stock broker platform, featuring **real-time ticking stock prices**, portfolio management, order execution, and a complete admin panel.

🔗 **Live Demo:** [zerodha-clone-flax.vercel.app](https://zerodha-clone-flax.vercel.app)

---

## ✨ Features

### 👤 User
- **Authentication** — Signup, Login, JWT-based sessions, password change
- **Live Prices** — 80+ NSE stocks with real-time price ticks via WebSockets (Socket.io)
- **Watchlist** — Add/remove stocks, live price updates
- **Orders** — Buy & Sell with MIS (intraday) and CNC (delivery) support
- **Holdings** — Long-term portfolio with P&L tracking
- **Positions** — Active intraday trades
- **Funds** — Virtual wallet with balance management
- **Profile** — View and update account details

### 🛡️ Admin
- **Admin Dashboard** — Platform-wide overview
- **User Management** — View all users and their details
- **Order Management** — Monitor all orders across the platform
- **Role-based Access Control** — Separate admin routes and guards

### ⚡ Technical Highlights
- Real-time price engine with a **random walk algorithm** + circuit breakers (±20% from open)
- **WebSocket price broadcasting** — all clients get synchronized live data
- Protected routes with `ProtectedRoute` and `AdminRoute` wrappers
- Auto token refresh / redirect on 401 responses
- CORS configured for multi-origin deployments

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Custom CSS |
| Charts | Chart.js, react-chartjs-2 |
| Real-time | Socket.io-client |
| HTTP Client | Axios |
| Backend | Node.js, Express |
| WebSockets | Socket.io |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| Database Host | MongoDB Atlas |

---

## 🗂️ Project Structure

```
zerodha-clone/
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── admin/               # Admin panel pages
│   │   ├── context/             # AuthContext, GeneralContext
│   │   ├── dashboard/           # Trading dashboard components
│   │   │   ├── Holdings.jsx
│   │   │   ├── Positions.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── WatchList.jsx
│   │   │   ├── Funds.jsx
│   │   │   ├── BuyActionWindow.jsx
│   │   │   └── SellActionWindow.jsx
│   │   ├── hooks/
│   │   │   └── useLivePrices.js # Socket.io price hook
│   │   ├── landing_page/        # Public marketing pages
│   │   │   └── signup/          # Login & Signup pages
│   │   └── utils/
│   │       └── api.js           # Axios instance with JWT interceptor
│   ├── vercel.json              # Vercel routing config
│   └── vite.config.js
│
└── backend/                     # Express API server
    ├── index.js                 # Entry point + Socket.io price engine
    ├── middleware/
    │   └── auth.js              # JWT verifyToken middleware
    ├── models/
    │   ├── User.js
    │   ├── Holding.js
    │   ├── Position.js
    │   ├── Order.js
    │   └── Watchlist.js
    └── routes/
        ├── auth.js              # /api/auth/*
        ├── dashboard.js         # /api/dashboard/*
        └── admin.js             # /api/admin/*
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/zerodha-clone.git
cd zerodha-clone
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:
```env
MONGO_URI=mongodb://localhost:27017/zerodha
JWT_SECRET=your_super_secret_jwt_key
PORT=3002
ADMIN_SETUP_KEY=your_admin_key
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev        # starts on http://localhost:3002
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

The frontend's Vite dev server proxies `/api/*` → `localhost:3002` automatically.

---

## 🌐 Deployment (Free Tier)

### Step 1 — MongoDB Atlas
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → create a free M0 cluster
2. **Database Access** → Add a database user
3. **Network Access** → Allow from anywhere (`0.0.0.0/0`)
4. **Connect** → Copy your connection string

### Step 2 — Backend on Render
1. Go to [render.com](https://render.com) → **New Web Service** → connect your GitHub repo
2. Set **Root Directory** to `backend`
3. Set **Start Command** to `node index.js`
4. Add these environment variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | Any long random string |
| `PORT` | `3002` |
| `ADMIN_SETUP_KEY` | Your chosen admin key |
| `FRONTEND_URL` | Your Vercel URL (add after Step 4) |

### Step 3 — Configure Frontend with your Render URL
In `frontend/vercel.json`, replace the backend URL:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-APP.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

In `frontend/.env.production`:
```env
VITE_BACKEND_URL=https://YOUR-APP.onrender.com
```

### Step 4 — Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project** → connect your repo
2. Set **Root Directory** to `frontend`
3. Framework: **Vite**
4. Add environment variable: `VITE_BACKEND_URL` = your Render URL
5. Deploy → copy your Vercel URL
6. Go back to Render → add `FRONTEND_URL` = your Vercel URL → redeploy backend

> ⚠️ **Note:** Render's free tier spins down after 15 min of inactivity. The first request after sleep may take ~30 seconds to respond.

---

## 🔌 API Reference

### Auth — `/api/auth`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/signup` | Register new user | ❌ |
| POST | `/login` | Login, returns JWT | ❌ |
| GET | `/me` | Get current user | ✅ |
| PUT | `/profile` | Update profile | ✅ |
| PUT | `/change-password` | Change password | ✅ |

### Dashboard — `/api/dashboard`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/holdings` | Get user holdings | ✅ |
| GET | `/positions` | Get intraday positions | ✅ |
| GET | `/orders` | Get all orders | ✅ |
| POST | `/orders` | Place a new order | ✅ |
| GET | `/watchlist` | Get watchlist | ✅ |
| POST | `/watchlist` | Add to watchlist | ✅ |
| DELETE | `/watchlist/:symbol` | Remove from watchlist | ✅ |
| GET | `/funds` | Get fund balance | ✅ |

### Admin — `/api/admin`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/users` | List all users | ✅ Admin |
| GET | `/users/:id` | User details | ✅ Admin |
| GET | `/orders` | All platform orders | ✅ Admin |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `price_snapshot` | Server → Client | Full price snapshot on connect |
| `price_update` | Server → Client | Live tick every 1 second |

---

## 🔒 Environment Variables

### Backend (`.env`)
```env
MONGO_URI=          # MongoDB connection string
JWT_SECRET=         # Secret for signing JWTs
PORT=3002           # Server port
ADMIN_SETUP_KEY=    # Key to promote users to admin
FRONTEND_URL=       # Allowed CORS origin
```

### Frontend (`.env.production`)
```env
VITE_BACKEND_URL=   # Your Render backend URL
```

> ⚠️ Never commit `.env` files to GitHub — they are gitignored.

---


## 🙌 Acknowledgements

- Inspired by [Zerodha Kite](https://kite.zerodha.com/) — India's largest stock broker
- Built as a college project to learn full-stack development with real-time features

---

## 📄 License

This project is for educational purposes only. Not affiliated with Zerodha.
