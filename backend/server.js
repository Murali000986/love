const express = require('express');
const cookieSession = require('cookie-session');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

// Load config from config.json (no .env needed)
const config = require('../config.json');
Object.assign(process.env, {
  PORT: config.PORT,
  SESSION_SECRET: config.SESSION_SECRET,
  ADMIN_USERNAME: config.ADMIN_USERNAME,
  ADMIN_PASSWORD: config.ADMIN_PASSWORD
});

const { adminExists, saveAdmin } = require('./db/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'love_meter_secret',
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true
}));

// Auto-create default admin from .env
const setupAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'adminpassword';

  if (!adminExists(username)) {
    const hashed = await bcrypt.hash(password, 10);
    saveAdmin({ _id: Date.now().toString(), username, password: hashed });
    console.log(`✅ Default admin created → Username: ${username}, Password: ${password}`);
  } else {
    console.log(`ℹ️  Admin "${username}" already exists.`);
  }
};

setupAdmin();

// Routes
app.use('/api', apiRoutes);

// Serve production build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/admin.html'));
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
