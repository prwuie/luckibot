import fs from 'fs';

const DB_PATH = './data/economy.json';

// -----------------------------
// 📦 LOAD DB
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
// 💾 SAVE DB
// -----------------------------
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// -----------------------------
// 👤 GET USER
// -----------------------------
export function getUser(id) {
  const db = loadDB();

  if (!db[id]) {
    db[id] = {
      balance: 1000,
      vault: 0,
      lastDaily: 0,
      streak: 0,
      lastWork: 0,
      lastSteal: 0,
      inventory: [],
      gun: false,
      vaultUnlocked: false,
      bountyOn: null,
      debt: 0
    };

    saveDB(db);
  }

  return db[id];
}

// -----------------------------
// ✏️ UPDATE USER
// -----------------------------
export function updateUser(id, user) {
  const db = loadDB();
  db[id] = user;
  saveDB(db);
}

// -----------------------------
// 📊 GET ALL USERS
// -----------------------------
export function getAllUsers() {
  return loadDB();
}