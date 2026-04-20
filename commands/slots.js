import { SlashCommandBuilder } from 'discord.js';
import { getBalance, addBalance, removeBalance } from '../utils/economy.js';

// 🎰 Weighted symbols (balanced + fun odds)
const symbols = [
  { emoji: '🍒', weight: 35, multiplier: 2 },
  { emoji: '🍋', weight: 28, multiplier: 2 },
  { emoji: '🔔', weight: 20, multiplier: 3 },
  { emoji: '⭐', weight: 14, multiplier: 4 },
  { emoji: '💎', weight: 3, multiplier: 8 }
];

// 🧠 weighted spin function
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
  const amount = interaction.options.getInteger('amount');
  const id = interaction.user.id;

  const bal = getBalance(id);

  // ❌ invalid bet
  if (amount <= 0 || amount > bal) {
    return interaction.reply({
      content: '❌ Invalid bet amount.',
      ephemeral: false
    });
  }

  // 🎰 spin reels
  const r1 = spin();
  const r2 = spin();
  const r3 = spin();

  const roll = [r1.emoji, r2.emoji, r3.emoji];
  const result = roll.join(' | ');

  let multiplier = 0;

  // 💎 jackpot (3 match)
  if (r1.emoji === r2.emoji && r2.emoji === r3.emoji) {
    multiplier = r1.multiplier;
  }

  // ✨ partial win (2 match)
  else if (
    r1.emoji === r2.emoji ||
    r2.emoji === r3.emoji ||
    r1.emoji === r3.emoji
  ) {
    multiplier = 1.2;
  }

  // 🔥 near-win bonus
  else if (
    r1.emoji === r2.emoji ||
    r2.emoji === r3.emoji
  ) {
    multiplier = 1.1;
  }

  // 🌟 SUPER RARE EVENT (VERY LOW CHANCE)
  const superEvent = Math.random() < 0.002; 
  // 0.2% chance (VERY rare)

  if (superEvent) {
    multiplier = multiplier > 0 ? multiplier * 10 : 10;
  }

  // 💰 calculate payout
  const change = multiplier > 0
    ? Math.floor(amount * multiplier)
    : -amount;

  if (change > 0) {
    addBalance(id, change);
  } else {
    removeBalance(id, Math.abs(change));
  }

  // 🎉 response message
  let message =
    `🎰 **SLOTS** 🎰\n` +
    `\`${result}\`\n\n`;

  if (superEvent) {
    message += `🌟 **SUPER LUCKY EVENT!** 🌟\n`;
  }

  message += change > 0
    ? `🔥 You won **$${change}**`
    : `💀 You lost **$${Math.abs(change)}**`;

  return interaction.reply(message);
}