import fs from 'fs';

const DB_PATH = './data/economy.json';

// -----------------------------
// 📦 Load DB
// -----------------------------
function loadDB() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
  }

  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// -----------------------------
// 💾 Save DB
// -----------------------------
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// -----------------------------
// 👤 Get user
// -----------------------------
export function getUser(userId) {
  const db = loadDB();

  if (!db[userId]) {
    db[userId] = {
      balance: 1000,
      lastWork: 0,
      lastSteal: 0,
      inventory: []
    };
    saveDB(db);
  }

  return db[userId];
}

// -----------------------------
// 💰 Update user
// -----------------------------
export function updateUser(userId, userData) {
  const db = loadDB();
  db[userId] = userData;
  saveDB(db);
}

// -----------------------------
// 📊 Get all users (leaderboard)
// -----------------------------
export function getAllUsers() {
  return loadDB();
}