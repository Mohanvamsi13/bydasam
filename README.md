# BYDASAM.COM — Photography Portfolio

Peter McKinnon-inspired photography website for bydasam.com

## Stack
- **Frontend:** React 18 + Vite + custom CSS (no UI library)
- **Backend:** Node.js + Express + MongoDB
- **Images:** Cloudinary
- **Auth:** JWT

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
node server.js          # runs on :5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev             # runs on :5173
```

## Hosting
See `docs/HOSTING_AND_DNS_GUIDE.md` — full guide including Namecheap DNS setup.
