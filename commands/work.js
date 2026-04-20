import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('work')
  .setDescription('Earn money');

export async function execute(interaction) {
  const id = interaction.user.id;
  const user = getUser(id);

  const now = Date.now();
  const cooldown = 300000; // 5 minutes

  // -------------------------
  // COOLDOWN
  // -------------------------
  if (now - user.lastWork < cooldown) {
    const remaining = Math.ceil((cooldown - (now - user.lastWork)) / 1000);
    return interaction.reply(
      `⏳ You're resting... come back in ${remaining}s`
    );
  }

  // -------------------------
  // JOBS (expanded + more variety)
  // -------------------------
  const jobs = [
    { text: 'You worked at McDonalds 🍔', pay: 120, weight: 18 },
    { text: 'You delivered pizza 🍕', pay: 220, weight: 16 },
    { text: 'You washed cars 🚗', pay: 180, weight: 14 },
    { text: 'You freelanced coding 💻', pay: 400, weight: 12 },
    { text: 'You streamed on Twitch 🎥', pay: 350, weight: 10 },
    { text: 'You found money on the ground 💰', pay: 500, weight: 6 },
    { text: 'You flipped burgers at a diner 🍳', pay: 140, weight: 10 },
    { text: 'You did yard work 🌱', pay: 160, weight: 8 },

    // FAIL / NEGATIVE OUTCOMES
    { text: 'You got scammed on Fiverr 💀', pay: -150, weight: 6 },
    { text: 'You got fired immediately 😂', pay: -200, weight: 4 },
    { text: 'You broke company equipment 🧨', pay: -250, weight: 3 },
    { text: 'You slept on the job and got fined 😴', pay: -100, weight: 3 }
  ];

  // -------------------------
  // WEIGHTED RANDOM PICK
  // -------------------------
  const totalWeight = jobs.reduce((a, b) => a + b.weight, 0);
  let roll = Math.random() * totalWeight;

  let job;
  for (const j of jobs) {
    if (roll < j.weight) {
      job = j;
      break;
    }
    roll -= j.weight;
  }

  if (!job) job = jobs[0];

  // -------------------------
  // APPLY RESULT
  // -------------------------
  user.balance += job.pay;
  user.lastWork = now;

  if (user.balance < 0) user.balance = 0;

  updateUser(id, user);

  // -------------------------
  // RESPONSE
  // -------------------------
  const emoji =
    job.pay > 300 ? '🔥' :
    job.pay > 0 ? '💰' :
    '💀';

  return interaction.reply(
    `${emoji} ${job.text}\n` +
    `${job.pay >= 0 ? '💵 +' : '💸 '}$${job.pay}\n` +
    `🏦 Balance: $${user.balance}`
  );
}