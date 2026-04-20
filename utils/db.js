import fs from 'fs';

const file = './data/users.json';

function load() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}');
  return JSON.parse(fs.readFileSync(file));
}

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function getUser(id) {
  const db = load();

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
      bountyOn: null
    };
    save(db);
  }

  return db[id];
}

export function updateUser(id, data) {
  const db = load();
  db[id] = data;
  save(db);
}

export function getUserDirect(id) {
  const db = load();
  return db[id];
}