const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Ensure data directory and files exist
function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(ADMIN_FILE)) {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify([], null, 2));
  }
}

function readJSON(filePath) {
  ensureFiles();
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  ensureFiles();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ── Results ──────────────────────────────────────────────
function getResults() {
  return readJSON(RESULTS_FILE);
}

function saveResult(entry) {
  const results = getResults();
  const record = {
    _id: Date.now().toString(),
    boyName: entry.boyName,
    girlName: entry.girlName,
    score: entry.score,
    message: entry.message,
    createdAt: new Date().toISOString()
  };
  results.unshift(record); // newest first
  writeJSON(RESULTS_FILE, results);
  return record;
}

// ── Admins ───────────────────────────────────────────────
function getAdmins() {
  return readJSON(ADMIN_FILE);
}

function findAdmin(username) {
  return getAdmins().find(a => a.username === username) || null;
}

function saveAdmin(admin) {
  const admins = getAdmins();
  admins.push(admin);
  writeJSON(ADMIN_FILE, admins);
}

function adminExists(username) {
  return getAdmins().some(a => a.username === username);
}

module.exports = { getResults, saveResult, findAdmin, saveAdmin, adminExists };
