import fs from 'fs';

const DB_PATH = './data/economy.json';

// -----------------------------
// 📦 Load database safely
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
// 💾 Save database
// -----------------------------
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// -----------------------------
// 👤 Get user data
// -----------------------------
export function getUser(userId) {
  const db = loadDB();

  if (!db[userId]) {
    db[userId] = {
      balance: 1000 // starting money
    };
    saveDB(db);
  }

  return db[userId];
}

// -----------------------------
// 💰 Get balance only
// -----------------------------
export function getBalance(userId) {
  return getUser(userId).balance;
}

// -----------------------------
// ➕ Add money
// -----------------------------
export function addBalance(userId, amount) {
  const db = loadDB();

  if (!db[userId]) {
    db[userId] = { balance: 1000 };
  }

  db[userId].balance += amount;
  saveDB(db);

  return db[userId].balance;
}

// -----------------------------
// ➖ Remove money
// -----------------------------
export function removeBalance(userId, amount) {
  const db = loadDB();

  if (!db[userId]) {
    db[userId] = { balance: 1000 };
  }

  db[userId].balance -= amount;

  if (db[userId].balance < 0) {
    db[userId].balance = 0;
  }

  saveDB(db);

  return db[userId].balance;
}

// -----------------------------
// ✏️ Update full user object
// -----------------------------
export function updateUser(userId, newData) {
  const db = loadDB();
  db[userId] = newData;
  saveDB(db);
}