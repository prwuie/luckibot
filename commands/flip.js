import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { getUser, updateUser } from '../utils/db.js';

// active games
const games = new Map();

// =========================
// HELPERS (SAFE)
// =========================
function flipCoin() {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// =========================
// COMMAND DATA
// =========================
export const data = new SlashCommandBuilder()
  .setName('flip')
  .setDescription('High-risk coin flip streak game')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Bet amount')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('choice')
      .setDescription('Heads or Tails')
      .setRequired(true)
      .addChoices(
        { name: 'Heads', value: 'heads' },
        { name: 'Tails', value: 'tails' }
      )
  );

// =========================
// EXECUTE COMMAND
// =========================
export async function execute(interaction) {

  const id = interaction.user.id;
  const user = getUser(id);

  const amount = interaction.options.getInteger('amount');
  const choice = interaction.options.getString('choice');

  if (amount <= 0 || amount > user.balance) {
    return interaction.reply({ content: '❌ Invalid bet.', flags: 64 });
  }

  user.balance -= amount;
  updateUser(id, user);

  const result = flipCoin();

  await interaction.reply({ content: '🪙 Flipping coin...' });

  await delay(1200);

  // instant loss
  if (result !== choice) {
    return interaction.editReply(`💀 You lost instantly. It was **${result}**`);
  }

  const game = {
    amount,
    choice,
    streak: 1,
    multiplier: 1.5,
    history: [result],
    lastActive: Date.now()
  };

  games.set(id, game);

  return interaction.editReply({
    content: render(game, `✅ WIN (${result})`),
    components: buttons()
  });
}

// =========================
// BUTTON HANDLER
// =========================
export async function handleFlipButtons(interaction) {

  const id = interaction.user.id;
  const game = games.get(id);

  if (!game) {
    return interaction.reply({ content: '❌ No active flip game.', flags: 64 });
  }

  // timeout
  if (Date.now() - game.lastActive > 15000) {
    games.delete(id);

    return interaction.update({
      content: '⏱️ Too slow — you lost everything.',
      components: []
    });
  }

  game.lastActive = Date.now();

  // =========================
  // CASHOUT
  // =========================
  if (interaction.customId === 'cashout') {

    const user = getUser(id);
    const winnings = Math.floor(game.amount * game.multiplier);

    user.balance += winnings;

    // best streak tracking
    if (!user.bestFlipStreak || game.streak > user.bestFlipStreak) {
      user.bestFlipStreak = game.streak;
    }

    updateUser(id, user);
    games.delete(id);

    return interaction.update({
      content:
`💰 CASHED OUT!

🔥 Streak: ${game.streak}
💵 Won: $${winnings}
🏆 Best Streak: ${user.bestFlipStreak}`,
      components: []
    });
  }

  // =========================
  // CONTINUE
  // =========================
  if (interaction.customId === 'continue') {

    const result = flipCoin();

    // 🍀 lucky event
    const lucky = Math.random() < 0.05;
    if (lucky) game.multiplier *= 2;

    // lose
    if (result !== game.choice) {
      games.delete(id);

      return interaction.update({
        content:
`💀 YOU LOST!

Coin: ${result}
🔥 Final Streak: ${game.streak}`,
        components: []
      });
    }

    // win
    game.streak++;
    game.history.push(result);
    game.multiplier *= 1.6;

    return interaction.update({
      content: render(game, `🔥 WIN (${result})${lucky ? '\n🍀 LUCKY BOOST!' : ''}`),
      components: buttons()
    });
  }
}

// =========================
// UI
// =========================
function buttons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('continue')
        .setLabel('Continue')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('cashout')
        .setLabel('Cashout')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

function render(game, msg) {
  return `
🪙 **COIN FLIP**

${msg}

🔥 Streak: ${game.streak}
💰 Multiplier: x${game.multiplier.toFixed(2)}
📜 History: ${game.history.join(' → ')}
`;
}

// =========================
// FIX FOR YOUR INDEX.JS LOADER
// =========================
export default {
  data,
  execute,
  handleFlipButtons
};