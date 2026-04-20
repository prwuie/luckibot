import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
// 📌 SLASH COMMAND EXPORT
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
  const user = getUser(id);

  const amount = interaction.options.getInteger('amount');

  if (amount <= 0 || amount > user.balance) {
    return interaction.reply({
      content: '❌ Invalid bet amount.',
      flags: 64
    });
  }

  user.balance -= amount;
  updateUser(id, user);

  const hand = [draw(), draw()];
  const dealer = [draw(), draw()];

  games.set(id, {
    hands: [hand],
    dealer,
    amount,
    activeHand: 0
  });

  return interaction.reply({
    content: render(id, false),
    components: buttons()
  });
}

// =======================
// 🎮 BUTTONS
// =======================
function buttons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Danger)
  );

  return [row];
}

// =======================
// 🧾 RENDER GAME
// =======================
function render(id, reveal) {
  const g = games.get(id);

  const handText = g.hands[0].map(c => c.name).join(' ');
  const dealerText = reveal
    ? g.dealer.map(c => c.name).join(' ')
    : g.dealer[0].name + ' ❓';

  return `🃏 **BLACKJACK**\n\nHand: ${handText} (${score(g.hands[0])})\n\nDealer: ${dealerText}\n\n💰 Bet: $${g.amount}`;
}

// =======================
// 🧠 BUTTON HANDLER (IMPORTANT EXPORT)
// =======================
export async function handleBlackjackButtons(interaction) {

  const g = games.get(interaction.user.id);
  if (!g) {
    return interaction.reply({ content: 'No game found.', flags: 64 });
  }

  const hand = g.hands[0];

  if (interaction.customId === 'hit') {
    hand.push(draw());

    if (score(hand) > 21) {
      games.delete(interaction.user.id);

      return interaction.update({
        content: render(interaction.user.id, true) + '\n\n💀 BUST!',
        components: []
      });
    }

    return interaction.update({
      content: render(interaction.user.id, false),
      components: buttons()
    });
  }

  if (interaction.customId === 'stand') {

    let dealerScore = score(g.dealer);

    while (dealerScore < 17) {
      g.dealer.push(draw());
      dealerScore = score(g.dealer);
    }

    const playerScore = score(hand);

    let win = 0;

    if (playerScore > 21) {
      win = 0;
    } else if (playerScore > dealerScore || dealerScore > 21) {
      win = g.amount * 2;
    } else if (playerScore === dealerScore) {
      win = g.amount;
    }

    const user = getUser(interaction.user.id);
    user.balance += win;
    updateUser(interaction.user.id, user);

    games.delete(interaction.user.id);

    return interaction.update({
      content:
        render(interaction.user.id, true) +
        `\n\n${win > g.amount ? `🎉 WIN +$${win}` : win === g.amount ? `🤝 PUSH +$${win}` : `💀 LOSS -$${g.amount}`}`,
      components: []
    });
  }
}