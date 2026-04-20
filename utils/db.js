import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
  filename: './data/economy.db',
  driver: sqlite3.Database
});

// create table
(async () => {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      balance INTEGER,
      vault INTEGER,
      lastDaily INTEGER,
      streak INTEGER,
      lastWork INTEGER,
      lastSteal INTEGER,
      inventory TEXT,
      gun INTEGER,
      vaultUnlocked INTEGER,
      bountyOn TEXT,
      debt INTEGER
    )
  `);
})();

export async function getUser(id) {
  const db = await dbPromise;

  let user = await db.get(`SELECT * FROM users WHERE id = ?`, id);

  if (!user) {
    user = {
      id,
      balance: 1000,
      vault: 0,
      lastDaily: 0,
      streak: 0,
      lastWork: 0,
      lastSteal: 0,
      inventory: JSON.stringify([]),
      gun: 0,
      vaultUnlocked: 0,
      bountyOn: null,
      debt: 0
    };

    await db.run(
      `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      user.id,
      user.balance,
      user.vault,
      user.lastDaily,
      user.streak,
      user.lastWork,
      user.lastSteal,
      user.inventory,
      user.gun,
      user.vaultUnlocked,
      user.bountyOn,
      user.debt
    );
  }

  return user;
}

export async function updateUser(user) {
  const db = await dbPromise;

  await db.run(
    `UPDATE users SET
      balance=?,
      vault=?,
      lastDaily=?,
      streak=?,
      lastWork=?,
      lastSteal=?,
      inventory=?,
      gun=?,
      vaultUnlocked=?,
      bountyOn=?,
      debt=?
     WHERE id=?`,
    user.balance,
    user.vault,
    user.lastDaily,
    user.streak,
    user.lastWork,
    user.lastSteal,
    user.inventory,
    user.gun,
    user.vaultUnlocked,
    user.bountyOn,
    user.debt,
    user.id
  );
}

export async function getAllUsers() {
  const db = await dbPromise;
  return await db.all(`SELECT * FROM users`);
}