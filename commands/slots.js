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

// 🧠 weighted spin
function spin() {
  const total = symbols.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * total;

  for (const s of symbols) {
    if (rand < s.weight) return s;
    rand -= s.weight;
  }
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
  const id = interaction.user.id;
  const amount = interaction.options.getInteger('amount');

  const user = getUser(id);

  // 🛡️ FIX: prevent broken/missing balance
  if (typeof user.balance !== 'number') {
    user.balance = 1000;
  }

  // ❌ invalid bet
  if (amount <= 0 || amount > user.balance) {
    return interaction.reply('❌ Invalid bet amount.');
  }

  // 💸 take bet safely
  user.balance = Math.max(0, user.balance - amount);

  // 🎰 spin reels
  const r1 = spin();
  const r2 = spin();
  const r3 = spin();

  const roll = [r1.emoji, r2.emoji, r3.emoji];

  let multiplier = 0;

  // 💎 jackpot
  if (r1.emoji === r2.emoji && r2.emoji === r3.emoji) {
    multiplier = r1.multiplier;
  }

  // ✨ 2 match
  else if (
    r1.emoji === r2.emoji ||
    r2.emoji === r3.emoji ||
    r1.emoji === r3.emoji
  ) {
    multiplier = 1.2;
  }

  // 🌟 super rare event
  const superEvent = Math.random() < 0.002;
  if (superEvent) {
    multiplier = multiplier > 0 ? multiplier * 10 : 10;
  }

  // 💰 winnings
  const winAmount = multiplier > 0
    ? Math.floor(amount * multiplier)
    : 0;

  user.balance += winAmount;

  // 🛡️ final safety clamp
  if (!user.balance || isNaN(user.balance)) {
    user.balance = 0;
  }

  updateUser(id, user);

  // 🎰 output
  let msg =
`🎰 **SLOTS**
\`${roll.join(' | ')}\`\n\n`;

  if (superEvent) {
    msg += `🌟 SUPER LUCKY EVENT!\n`;
  }

  msg += winAmount > 0
    ? `🔥 You won $${winAmount}`
    : `💀 You lost $${amount}`;

  return interaction.reply(msg);
}