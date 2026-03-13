# Zerodha Clone — Trading Web App

A full-stack trading platform clone with **live ticking stock prices** via WebSockets.

## 🚀 Tech Stack
- **Frontend:** React + Vite, Socket.io-client
- **Backend:** Node.js + Express, Socket.io
- **Database:** MongoDB Atlas
- **Live Prices:** Simulated real-time price engine (random walk algorithm)

---

## 💻 Running Locally

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # then fill in your values
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:5173` | Backend: `http://localhost:3002`

---

## 🌐 Deployment (Free)

### Step 1 — MongoDB Atlas
1. [mongodb.com/atlas](https://mongodb.com/atlas) → free M0 cluster
2. Database Access → create user
3. Network Access → allow `0.0.0.0/0`
4. Connect → copy connection string

### Step 2 — Backend on Render
1. [render.com](https://render.com) → New Web Service → connect repo
2. Root Directory: `backend` | Start: `node index.js`
3. Environment Variables:
   - `MONGO_URI` = Atlas connection string
   - `JWT_SECRET` = any random string
   - `PORT` = 3002
   - `ADMIN_SETUP_KEY` = admin_setup_key_2024
   - `FRONTEND_URL` = https://your-app.vercel.app ← add after Vercel deploy

### Step 3 — Update your Render URL in frontend
- In `frontend/vercel.json` → replace `your-backend.onrender.com`
- In `frontend/.env.production` → replace `your-backend.onrender.com`

### Step 4 — Frontend on Vercel
1. [vercel.com](https://vercel.com) → New Project → connect repo
2. Root Directory: `frontend` | Framework: Vite
3. Environment Variable: `VITE_BACKEND_URL` = your Render URL
4. Deploy → copy Vercel URL → add as `FRONTEND_URL` in Render → redeploy backend

---

> ⚠️ Render free tier sleeps after 15 min inactivity. First load may take ~30s.
> Never commit `.env` to GitHub — it is gitignored.
