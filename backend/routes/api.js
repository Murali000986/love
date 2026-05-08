const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getResults, saveResult, findAdmin, saveAdmin, adminExists } = require('../db/db');

// ── Auth middleware ──────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
};

// ── Love score message ───────────────────────────────────
const getMessage = (score) => {
  if (score >= 90) return "A match made in heaven! 💖";
  if (score >= 75) return "True love is in the air! 💕";
  if (score >= 50) return "There's a spark! Give it a try! 🔥";
  if (score >= 30) return "Friendzone alert... but anything is possible! 😅";
  return "Maybe just stay friends? 💔";
};

// ── Calculate Love Score ─────────────────────────────────
router.post('/calculate', async (req, res) => {
  try {
    const { boyName, girlName } = req.body;

    if (!boyName || !girlName) {
      return res.status(400).json({ error: 'Both names are required' });
    }

    const normalizeName = (name) => name.toLowerCase().trim();
    const names = [normalizeName(boyName), normalizeName(girlName)].sort();
    const combined = names[0] + "loves" + names[1];

    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }

    let score = (Math.abs(hash) % 100) + 1;

    const boyNorm = normalizeName(boyName);
    const girlNorm = normalizeName(girlName);
    if (['aathithya', 'aathi', 'aathithya a'].includes(boyNorm) && girlNorm.startsWith('j')) {
      score = 100;
    }

    const message = getMessage(score);

    // Save to JSON file
    saveResult({ boyName, girlName, score, message });

    res.json({ score, message });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin Login ──────────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = findAdmin(username);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.adminId = admin._id;
    res.json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin Logout ─────────────────────────────────────────
router.post('/admin/logout', (req, res) => {
  req.session = null;
  res.json({ success: true, message: 'Logged out successfully' });
});

// ── Admin Session Check ───────────────────────────────────
router.get('/admin/check', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// ── Get All Results (Admin only) ─────────────────────────
router.get('/admin/results', isAdmin, (req, res) => {
  try {
    const results = getResults();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
