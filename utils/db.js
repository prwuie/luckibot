import fs from 'fs';

const DB_PATH = './data/economy.json';

// =========================
// 🧠 IN-MEMORY CACHE
// =========================
let db = {};

// =========================
// 📦 INIT DB ON START
// =========================
function initDB() {
  try {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
    }

    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({}));
    }

    const raw = fs.readFileSync(DB_PATH, 'utf8');
    db = JSON.parse(raw || '{}');

  } catch (err) {
    console.error("DB INIT ERROR:", err);
    db = {};
  }
}

// load once at startup
initDB();

// =========================
// 💾 SAVE (THROTTLED SAFE WRITE)
// =========================
let saveTimeout;

function saveDB() {
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (err) {
      console.error("DB SAVE ERROR:", err);
    }
  }, 300);
}

// =========================
// 👤 GET USER (FAST + SAFE)
// =========================
export function getUser(id) {

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
  }

  // safety
  db[id].balance ??= 1000;
  db[id].inventory ??= [];
  db[id].debt ??= 0;

  return db[id];
}

// =========================
// ✏️ UPDATE USER (SAFE MERGE)
// =========================
export function updateUser(id, user) {

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
    debt: 0,
    ...user
  };

  saveDB();
}

// =========================
// 📊 GET ALL USERS
// =========================
export function getAllUsers() {
  return db;
}