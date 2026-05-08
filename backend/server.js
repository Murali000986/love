const express = require('express');
const cookieSession = require('cookie-session');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

// Load config from config.json — works locally and on Vercel
let config = {};
try {
  config = require('../config.json');
} catch (e) {
  console.warn('config.json not found, using defaults');
}

const PORT           = config.PORT           || process.env.PORT           || 3000;
const SESSION_SECRET = config.SESSION_SECRET || process.env.SESSION_SECRET || 'love_meter_secret';
const ADMIN_USERNAME = config.ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = config.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'adminpassword';

const { adminExists, saveAdmin } = require('./db/db');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  secret: SESSION_SECRET,
  maxAge: 24 * 60 * 60 * 1000,
  secure: false,
  httpOnly: true
}));

// Auto-create default admin on every cold start (needed for Vercel in-memory)
const setupAdmin = async () => {
  if (!adminExists(ADMIN_USERNAME)) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    saveAdmin({ _id: Date.now().toString(), username: ADMIN_USERNAME, password: hashed });
    console.log(`✅ Admin created → ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`ℹ️  Admin "${ADMIN_USERNAME}" already exists.`);
  }
};

setupAdmin();

// API Routes
app.use('/api', apiRoutes);

// Only listen locally (Vercel handles this itself)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
