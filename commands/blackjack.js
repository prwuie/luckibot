import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { getUser, updateUser } from '../utils/db.js';

// =======================
// 🃏 CARDS
// =======================
const suits = ['♠️', '♥️', '♦️', '♣️'];

const cards = [
  { card: 'A', value: 11 },
  { card: '2', value: 2 },
  { card: '3', value: 3 },
  { card: '4', value: 4 },
  { card: '5', value: 5 },
  { card: '6', value: 6 },
  { card: '7', value: 7 },
  { card: '8', value: 8 },
  { card: '9', value: 9 },
  { card: '10', value: 10 },
  { card: 'J', value: 10 },
  { card: 'Q', value: 10 },
  { card: 'K', value: 10 }
];

function draw() {
  const c = cards[Math.floor(Math.random() * cards.length)];
  const s = suits[Math.floor(Math.random() * suits.length)];
  return { name: `${c.card}${s}`, value: c.value };
}

function score(hand) {
  let total = hand.reduce((a, c) => a + c.value, 0);
  let aces = hand.filter(c => c.name.startsWith('A')).length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

// =======================
// 🎮 ACTIVE GAMES
// =======================
const games = new Map();

// =======================
// 📌 COMMAND
// =======================
export const data = new SlashCommandBuilder()
  .setName('blackjack')
  .setDescription('Play blackjack')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Bet amount')
      .setRequired(true)
  );

// =======================
// 🚀 START GAME
// =======================
export async function execute(interaction) {

  const id = interaction.user.id;
  const amount = interaction.options.getInteger('amount');

  const user = getUser(id);

  if (amount <= 0 || amount > user.balance) {
    return interaction.reply({
      content: '❌ Invalid bet amount.',
      flags: 64
    });
  }

  user.balance -= amount;
  updateUser(id, user);

  const player = [draw(), draw()];
  const dealer = [draw(), draw()];

  games.set(id, {
    player,
    dealer,
    bet: amount
  });

  return interaction.reply({
    content: render(id, false),
    components: getButtons()
  });
}

// =======================
// 🎮 BUTTONS
// =======================
function getButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('bj_hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('bj_stand')
        .setLabel('Stand')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

// =======================
// 🧾 RENDER
// =======================
function render(id, reveal) {
  const g = games.get(id);

  if (!g) return 'Game expired.';

  const player = g.player.map(c => c.name).join(' ');
  const dealer = reveal
    ? g.dealer.map(c => c.name).join(' ')
    : `${g.dealer[0].name} ❓`;

  return `🃏 **BLACKJACK**

Your Hand: ${player} (${score(g.player)})

Dealer: ${dealer}

💰 Bet: $${g.bet}`;
}

// =======================
// 🧠 BUTTON HANDLER
// =======================
export async function handleBlackjackButtons(interaction) {

  const id = interaction.user.id;
  const g = games.get(id);

  if (!g) {
    return interaction.reply({
      content: '❌ No active game.',
      flags: 64
    });
  }

  // ===================
  // HIT
  // ===================
  if (interaction.customId === 'bj_hit') {

    g.player.push(draw());

    if (score(g.player) > 21) {

      const final = render(id, true); // render BEFORE delete
      games.delete(id);

      return interaction.update({
        content: final + '\n\n💀 BUST! You lost.',
        components: []
      });
    }

    return interaction.update({
      content: render(id, false),
      components: getButtons()
    });
  }

  // ===================
  // STAND (FIXED)
  // ===================
  if (interaction.customId === 'bj_stand') {

    while (score(g.dealer) < 17) {
      g.dealer.push(draw());
    }

    const playerScore = score(g.player);
    const dealerScore = score(g.dealer);

    let win = 0;

    if (dealerScore > 21 || playerScore > dealerScore) {
      win = g.bet * 2;
    } else if (playerScore === dealerScore) {
      win = g.bet;
    }

    const user = getUser(id);
    user.balance += win;
    updateUser(id, user);

    const final = render(id, true); // ✅ render BEFORE delete

    let result =
      win > g.bet ? `🎉 WIN +$${win}` :
      win === g.bet ? `🤝 PUSH +$${win}` :
      `💀 LOSS -$${g.bet}`;

    games.delete(id); // ✅ delete AFTER render

    return interaction.update({
      content: final + `\n\n${result}`,
      components: []
    });
  }
}