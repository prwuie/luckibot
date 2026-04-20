import fs from 'fs';

const DB_PATH = './data/economy.json';

// -----------------------------
// 📦 LOAD DB (SAFE)
// -----------------------------
function loadDB() {
  try {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
    }

    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({}));
    }

    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw || '{}');

  } catch (err) {
    console.error("DB LOAD ERROR:", err);
    return {};
  }
}

// -----------------------------
// 💾 SAVE DB (SAFE)
// -----------------------------
function saveDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("DB SAVE ERROR:", err);
  }
}

// -----------------------------
// 👤 GET USER (SAFE + GUARANTEED STRUCTURE)
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
  }

  // 🛡️ force safety (prevents undefined crashes)
  db[id].balance ??= 1000;
  db[id].inventory ??= [];
  db[id].debt ??= 0;

  saveDB(db);
  return db[id];
}

// -----------------------------
// ✏️ UPDATE USER (SAFE MERGE)
// -----------------------------
export function updateUser(id, user) {
  const db = loadDB();

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

  saveDB(db);
}

// -----------------------------
// 📊 GET ALL USERS
// -----------------------------
export function getAllUsers() {
  return loadDB();
}