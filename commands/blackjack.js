import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import {
  getBalance,
  addBalance,
  removeBalance
} from '../utils/economy.js';

// ----------------------
// Cards
// ----------------------
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

// ----------------------
// Games
// ----------------------
const games = new Map();

// ----------------------
// Command
// ----------------------
export const data = new SlashCommandBuilder()
  .setName('blackjack')
  .setDescription('Play blackjack')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Bet amount')
      .setRequired(true)
  );

// ----------------------
// Start game
// ----------------------
export async function execute(interaction) {
  const amount = interaction.options.getInteger('amount');
  const id = interaction.user.id;

  const bal = getBalance(id);
  if (amount > bal) return interaction.reply('❌ Not enough money.');

  removeBalance(id, amount);

  const hand1 = [draw(), draw()];
  const hand2 = [draw(), draw()];
  const dealer = [draw(), draw()];

  const canSplit =
    hand1[0].value === hand1[1].value;

  games.set(id, {
    hands: [hand1],
    dealer,
    amount,
    activeHand: 0,
    split: false,
    canSplit
  });

  return interaction.reply({
    content: render(id, false),
    components: buttons(true, canSplit)
  });
}

// ----------------------
// Buttons
// ----------------------
function buttons(showSplit, canSplit) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('double').setLabel('Double').setStyle(ButtonStyle.Success)
  );

  if (showSplit && canSplit) {
    row.addComponents(
      new ButtonBuilder().setCustomId('split').setLabel('Split').setStyle(ButtonStyle.Secondary)
    );
  }

  return [row];
}

// ----------------------
// Render
// ----------------------
function render(id, reveal) {
  const g = games.get(id);

  const handsText = g.hands.map((h, i) => {
    const prefix = i === g.activeHand ? '👉 ' : '';
    return `${prefix}Hand ${i + 1}: ${h.map(c => c.name).join(' ')} (${score(h)})`;
  }).join('\n');

  return `
🃏 **BLACKJACK (SPLIT ENABLED)**

${handsText}

🤖 Dealer: ${reveal ? g.dealer.map(c => c.name).join(' ') : g.dealer[0].name + ' ❓'}

💰 Bet: $${g.amount}
`;
}

// ----------------------
// Handler
// ----------------------
export async function handleBlackjackButtons(interaction) {
  const g = games.get(interaction.user.id);
  if (!g) return interaction.reply({ content: 'No game.', ephemeral: true });

  const hand = g.hands[g.activeHand];

  const currentScore = () => score(hand);

  // ---------------- HIT ----------------
  if (interaction.customId === 'hit') {
    hand.push(draw());

    if (currentScore() > 21) {
      g.activeHand++;

      if (g.activeHand >= g.hands.length) {
        return resolve(interaction);
      }

      return interaction.update({
        content: render(interaction.user.id, false),
        components: buttons(false, false)
      });
    }

    return interaction.update({
      content: render(interaction.user.id, false),
      components: buttons(false, false)
    });
  }

  // ---------------- STAND ----------------
  if (interaction.customId === 'stand') {
    g.activeHand++;

    if (g.activeHand >= g.hands.length) {
      return resolve(interaction);
    }

    return interaction.update({
      content: render(interaction.user.id, false),
      components: buttons(false, false)
    });
  }

  // ---------------- DOUBLE ----------------
  if (interaction.customId === 'double') {
    const bal = getBalance(interaction.user.id);
    if (bal < g.amount) {
      return interaction.reply({ content: 'Not enough money.', ephemeral: true });
    }

    removeBalance(interaction.user.id, g.amount);
    g.amount *= 2;

    hand.push(draw());

    g.activeHand++;

    if (g.activeHand >= g.hands.length) {
      return resolve(interaction);
    }

    return interaction.update({
      content: render(interaction.user.id, false),
      components: buttons(false, false)
    });
  }

  // ---------------- SPLIT ----------------
  if (interaction.customId === 'split') {
    if (!g.canSplit || g.split) {
      return interaction.reply({ content: 'Cannot split.', ephemeral: true });
    }

    const [a, b] = g.hands[0];

    g.hands = [
      [a, draw()],
      [b, draw()]
    ];

    g.split = true;
    g.activeHand = 0;

    return interaction.update({
      content: render(interaction.user.id, false),
      components: buttons(false, false)
    });
  }
}

// ----------------------
// Resolve
// ----------------------
function resolve(interaction) {
  const g = games.get(interaction.user.id);

  while (score(g.dealer) < 17) {
    g.dealer.push(draw());
  }

  const dealerScore = score(g.dealer);

  let totalWin = 0;

  for (const hand of g.hands) {
    const s = score(hand);

    if (s > 21) continue;

    if (s > dealerScore || dealerScore > 21) {
      const isBJ = hand.length === 2 && s === 21;

      totalWin += isBJ
        ? Math.floor(g.amount * 2.5)
        : g.amount * 2;
    } else if (s === dealerScore) {
      totalWin += g.amount;
    }
  }

  if (totalWin > 0) {
    addBalance(interaction.user.id, totalWin);
  }

  const result =
    totalWin > g.amount
      ? `🎉 You won $${totalWin}`
      : totalWin === g.amount
        ? `🤝 Push`
        : `💀 You lost`;

  games.delete(interaction.user.id);

  return interaction.update({
    content: render(interaction.user.id, true) + `\n\n${result}`,
    components: []
  });
}