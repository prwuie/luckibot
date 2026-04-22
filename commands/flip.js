import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { getUser, updateUser } from '../utils/db.js';

const games = new Map();

const TIMEOUT = 30000;
const WARNING_TIME = 10000;

// =========================
// COMMAND
// =========================
export const data = new SlashCommandBuilder()
  .setName('flip')
  .setDescription('Phase-based coin prediction game')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Bet amount')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('choice')
      .setDescription('Initial prediction')
      .setRequired(true)
      .addChoices(
        { name: 'Heads', value: 'heads' },
        { name: 'Tails', value: 'tails' }
      )
  );

// =========================
// START GAME
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

  const result = flip();

  if (result !== choice) {
    return interaction.reply(
`💀 YOU LOST!
Coin: ${result}
Bet: $${amount}`
    );
  }

  const now = Date.now();

  const game = {
    amount,
    choice,
    streak: 1,
    multiplier: 1.5,
    phase: 'choose',
    lastResult: result,
    lastActive: now
  };

  games.set(id, game);

  return interaction.reply({
    content: render(game, result),
    components: buttons()
  });
}

// =========================
// BUTTON HANDLER
// =========================
export function handleFlipButtons(interaction) {

  const id = interaction.user.id;
  const game = games.get(id);

  if (!game) {
    return interaction.reply({ content: '❌ No active game.', flags: 64 });
  }

  const now = Date.now();

  // =========================
  // 💀 HARD TIMEOUT (30s)
  // =========================
  if (now - game.lastActive > TIMEOUT) {
    games.delete(id);

    return interaction.update({
      content:
`⏱️ Game expired (30s timeout)
💀 You lost your streak.`,
      components: []
    });
  }

  // =========================
  // ⚠️ WARNING (10s LEFT)
  // =========================
  const timeLeft = TIMEOUT - (now - game.lastActive);

  if (timeLeft <= WARNING_TIME) {
    game.lastActive = now;

    return interaction.update({
      content:
`⚠️ HURRY UP!

⏱️ ${Math.ceil(timeLeft / 1000)}s left
🔥 Streak: ${game.streak}
💰 Multiplier: x${game.multiplier.toFixed(2)}`,
      components: buttons()
    });
  }

  // =========================
  // RESET TIMER ON ACTION
  // =========================
  game.lastActive = now;

  // =========================
  // CASHOUT
  // =========================
  if (interaction.customId === 'cashout') {

    const user = getUser(id);

    const winnings = Math.floor(game.amount * game.multiplier);

    user.balance += winnings;
    updateUser(id, user);

    games.delete(id);

    return interaction.update({
      content:
`💰 CASHED OUT!
🔥 Streak: ${game.streak}
💵 Won: $${winnings}`,
      components: []
    });
  }

  // =========================
  // CONTINUE SYSTEM (PHASE)
  // =========================
  if (interaction.customId === 'continue') {

    // PHASE 1: resolve flip
    if (game.phase === 'choose') {

      const result = flip();
      const win = result === game.choice;

      if (!win) {
        games.delete(id);

        return interaction.update({
          content:
`💀 YOU LOST!
Coin: ${result}
🔥 Final Streak: ${game.streak}`,
          components: []
        });
      }

      game.streak++;
      game.multiplier *= 1.6;
      game.lastResult = result;

      game.phase = 'pick';

      return interaction.update({
        content:
`🔥 WIN! Coin: ${result}

🧠 Click Continue to change prediction`,
        components: buttons()
      });
    }

    // PHASE 2: change prediction
    if (game.phase === 'pick') {

      game.choice = game.choice === 'heads' ? 'tails' : 'heads';
      game.phase = 'choose';

      return interaction.update({
        content:
`🧠 New prediction: **${game.choice}**

Press Continue to flip again.`,
        components: buttons()
      });
    }
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
        .setLabel('Continue / Choose')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('cashout')
        .setLabel('Cashout')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

// =========================
// RENDER
// =========================
function render(game, result) {
  return `
🪙 **COIN FLIP PHASE GAME**

🔥 Result: ${result}
🎯 Current Guess: ${game.choice}
🔥 Streak: ${game.streak}
💰 Multiplier: x${game.multiplier.toFixed(2)}

⚡ You can change prediction after each win
`;
}

// =========================
// COIN FLIP
// =========================
function flip() {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

// =========================
// EXPORT FIX
// =========================
export default {
  data,
  execute,
  handleFlipButtons
};