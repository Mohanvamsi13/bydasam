require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use('/api/auth',     rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/bookings', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }));
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/photos',     require('./routes/photos'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/services',   require('./routes/services'));
app.use('/api/bookings',   require('./routes/bookings'));
app.use('/api/settings',   require('./routes/settings'));
app.use('/api/social',     require('./routes/social'));
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => console.log(`🚀 Running on port ${process.env.PORT || 5000}`));
  })
  .catch(err => { console.error('❌ DB error:', err); process.exit(1); });
