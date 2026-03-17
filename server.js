require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app = express();

// ── MIDDLEWARE ───────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting — max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please wait a few minutes.' }
});
// Stricter limit on auth routes — max 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' }
});

app.use('/api', limiter);
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ── ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat',  require('./routes/chat'));

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── ERROR HANDLER ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Only image files are allowed')
    return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// ── CONNECT DB & START ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    // Create admin account on first run if it doesn't exist
    const User = require('./models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name:     process.env.ADMIN_NAME     || 'Admin',
        email:    process.env.ADMIN_EMAIL    || 'admin@reclaim.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        phone:    process.env.ADMIN_PHONE    || '',
        role:     'admin'
      });
      console.log(`✅ Admin account created: ${process.env.ADMIN_EMAIL || 'admin@reclaim.com'}`);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Re-Claim server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
