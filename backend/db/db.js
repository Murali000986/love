const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// On Vercel (serverless), we can't write to filesystem — use in-memory storage
// On local dev, use JSON files in backend/data/
const IS_VERCEL = !!process.env.VERCEL;

const DATA_DIR = path.join(__dirname, '../data');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// In-memory fallback for Vercel
let memResults = [];
let memAdmins = [];
let memInitialized = false;

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, '[]');
  if (!fs.existsSync(ADMIN_FILE)) fs.writeFileSync(ADMIN_FILE, '[]');
}

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return []; }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ── Results ──────────────────────────────────────────────
function getResults() {
  if (IS_VERCEL) return memResults;
  ensureFiles();
  return readJSON(RESULTS_FILE);
}

function saveResult(entry) {
  const record = {
    _id: Date.now().toString(),
    boyName: entry.boyName,
    girlName: entry.girlName,
    score: entry.score,
    message: entry.message,
    createdAt: new Date().toISOString()
  };

  if (IS_VERCEL) {
    memResults.unshift(record);
  } else {
    ensureFiles();
    const results = readJSON(RESULTS_FILE);
    results.unshift(record);
    writeJSON(RESULTS_FILE, results);
  }
  return record;
}

// ── Admins ───────────────────────────────────────────────
function getAdmins() {
  if (IS_VERCEL) return memAdmins;
  ensureFiles();
  return readJSON(ADMIN_FILE);
}

function findAdmin(username) {
  return getAdmins().find(a => a.username === username) || null;
}

function saveAdmin(admin) {
  if (IS_VERCEL) {
    memAdmins.push(admin);
  } else {
    ensureFiles();
    const admins = readJSON(ADMIN_FILE);
    admins.push(admin);
    writeJSON(ADMIN_FILE, admins);
  }
}

function adminExists(username) {
  return getAdmins().some(a => a.username === username);
}

module.exports = { getResults, saveResult, findAdmin, saveAdmin, adminExists };
