import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

// 🎰 Symbols
const symbols = [
  { emoji: '🍒', weight: 35, multiplier: 2 },
  { emoji: '🍋', weight: 28, multiplier: 2 },
  { emoji: '🔔', weight: 20, multiplier: 3 },
  { emoji: '⭐', weight: 14, multiplier: 4 },
  { emoji: '💎', weight: 3, multiplier: 8 }
];

function spin() {
  const total = symbols.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * total;

  for (const s of symbols) {
    if (rand < s.weight) return s;
    rand -= s.weight;
  }

  return symbols[0];
}

export const data = new SlashCommandBuilder()
  .setName('slots')
  .setDescription('Spin the slot machine')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Bet amount')
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    const id = interaction.user.id;
    const amount = interaction.options.getInteger('amount');

    // ✅ FIXED: await + safe fallback
    const user = (await getUser(id)) ?? { balance: 1000 };

    if (typeof user.balance !== 'number') user.balance = 1000;

    if (amount <= 0 || amount > user.balance) {
      return interaction.reply({
        content: '❌ Invalid bet amount.',
flags: 64    
  });
    }

    user.balance -= amount;

    const r1 = spin();
    const r2 = spin();
    const r3 = spin();

    const roll = [r1.emoji, r2.emoji, r3.emoji];

    let multiplier = 0;

    if (r1.emoji === r2.emoji && r2.emoji === r3.emoji) {
      multiplier = r1.multiplier;
    } else if (
      r1.emoji === r2.emoji ||
      r2.emoji === r3.emoji ||
      r1.emoji === r3.emoji
    ) {
      multiplier = 1.2;
    }

    const superEvent = Math.random() < 0.002;
    if (superEvent) {
      multiplier = multiplier > 0 ? multiplier * 10 : 10;
    }

    const winAmount = multiplier > 0
      ? Math.floor(amount * multiplier)
      : 0;

    user.balance += winAmount;

    if (isNaN(user.balance) || user.balance < 0) {
      user.balance = 0;
    }

    await updateUser(id, user);

    let msg =
`🎰 **SLOTS**
\`${roll.join(' | ')}\`\n\n`;

    if (superEvent) msg += `🌟 SUPER LUCKY EVENT!\n`;

    msg += winAmount > 0
      ? `🔥 You won $${winAmount}`
      : `💀 You lost $${amount}`;

    return interaction.reply({ content: msg });

  } catch (err) {
    console.error("SLOTS ERROR:", err);

    return interaction.reply({
      content: '❌ Slot machine error. Try again.',
flags: 64    });
  }
}