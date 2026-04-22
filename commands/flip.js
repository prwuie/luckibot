import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { getUser, updateUser } from '../utils/db.js';

const games = new Map();

const TIMEOUT = 30000;

// =========================
// COMMAND
// =========================
export const data = new SlashCommandBuilder()
  .setName('flip')
  .setDescription('Coin prediction gambling game')
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

  // ❌ instant loss
  if (result !== choice) {
    return interaction.reply(
`💀 YOU LOST!
Coin: ${result}
Bet: $${amount}`
    );
  }

  const game = {
    amount,
    choice: null,
    streak: 1,
    multiplier: 1.5,
    awaitingChoice: true,
    lastActive: Date.now()
  };

  games.set(id, game);

  return interaction.reply({
    content:
`🔥 WIN!

🧠 Choose your next prediction:`,
    components: choiceButtons()
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
  // TIMEOUT
  // =========================
  if (now - game.lastActive > TIMEOUT) {
    games.delete(id);

    return interaction.update({
      content: '⏱️ Game expired (30s timeout).',
      components: []
    });
  }

  game.lastActive = now;

  // =========================
  // CASHOUT (ALWAYS AVAILABLE)
  // =========================
  if (interaction.customId === 'cashout') {

    const user = getUser(id);
    const winnings = Math.floor(game.amount * game.multiplier);

    user.balance += winnings;

    // ✅ SAVE BEST STREAK (FIX)
    if (!user.bestFlipStreak || game.streak > user.bestFlipStreak) {
      user.bestFlipStreak = game.streak;
    }

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
  // CONTINUE → ASK CHOICE
  // =========================
  if (interaction.customId === 'continue') {

    return interaction.update({
      content:
`🧠 Choose your prediction:`,
      components: choiceButtons()
    });
  }

  // =========================
  // HEADS / TAILS CHOICE
  // =========================
  if (interaction.customId === 'heads' || interaction.customId === 'tails') {

    const choice = interaction.customId;
    const result = flip();

    if (result !== choice) {

      games.delete(id);

      return interaction.update({
        content:
`💀 YOU LOST!
You chose: ${choice}
Coin: ${result}
🔥 Final Streak: ${game.streak}`,
        components: []
      });
    }

    game.streak++;
    game.multiplier *= 1.6;
    game.lastActive = now;

    // ✅ SAVE BEST STREAK (FIX)
    const user = getUser(id);

    if (!user.bestFlipStreak || game.streak > user.bestFlipStreak) {
      user.bestFlipStreak = game.streak;
    }

    updateUser(id, user);

    return interaction.update({
      content:
`🔥 WIN!

Coin: ${result}
🔥 Streak: ${game.streak}
💰 Multiplier: x${game.multiplier.toFixed(2)}

👉 You can cash out anytime or continue.`,
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

function choiceButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('heads')
        .setLabel('Heads')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('tails')
        .setLabel('Tails')
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

// =========================
// COIN FLIP
// =========================
function flip() {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

// =========================
// EXPORT
// =========================
export default {
  data,
  execute,
  handleFlipButtons
};