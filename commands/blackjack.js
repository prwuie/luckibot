import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { getUser, updateUser } from '../utils/db.js';

// =======================
// CARDS
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
// GAME STATE
// =======================
const games = new Map();

// =======================
// COMMAND
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
// START GAME
// =======================
export async function execute(interaction) {
  const id = interaction.user.id;
  const amount = interaction.options.getInteger('amount');

  let user = await getUser(id);
  if (!user) user = { balance: 1000 };

  if (typeof user.balance !== 'number') user.balance = 1000;

  if (amount <= 0 || amount > user.balance) {
    return interaction.reply({
      content: '❌ Invalid bet amount.',
      flags: 64
    });
  }

  user.balance -= amount;
  await updateUser(id, user);

  const hand1 = [draw(), draw()];
  const dealer = [draw(), draw()];

  const canSplit = hand1[0].value === hand1[1].value;

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
    components: buttons(canSplit)
  });
}

// =======================
// BUTTONS
// =======================
function buttons(canSplit) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('double').setLabel('Double').setStyle(ButtonStyle.Success)
  );

  if (canSplit) {
    row.addComponents(
      new ButtonBuilder().setCustomId('split').setLabel('Split').setStyle(ButtonStyle.Secondary)
    );
  }

  return [row];
}

// =======================
// RENDER
// =======================
function render(id, reveal) {
  const g = games.get(id);

  const handsText = g.hands.map((h, i) => {
    const prefix = i === g.activeHand ? '👉 ' : '';
    return `${prefix}Hand ${i + 1}: ${h.map(c => c.name).join(' ')} (${score(h)})`;
  }).join('\n');

  return `
🃏 **BLACKJACK**

${handsText}

🤖 Dealer: ${reveal
    ? g.dealer.map(c => c.name).join(' ')
    : g.dealer[0].name + ' ❓'}

💰 Bet: $${g.amount}
`;
}

// =======================
// BUTTON HANDLER
// =======================
export async function handleBlackjackButtons(interaction) {
  try {

    const g = games.get(interaction.user.id);

    if (!g) {
      return interaction.reply({
        content: '❌ Game expired.',
        flags: 64
      });
    }

    const hand = g.hands[g.activeHand];
    const getScore = () => score(hand);

    // HIT
    if (interaction.customId === 'hit') {

      hand.push(draw());

      if (getScore() > 21) {
        g.activeHand++;

        if (g.activeHand >= g.hands.length) {
          return resolve(interaction);
        }

        return interaction.update({
          content: render(interaction.user.id, false),
          components: buttons(g.canSplit)
        });
      }

      return interaction.update({
        content: render(interaction.user.id, false),
        components: buttons(g.canSplit)
      });
    }

    // STAND
    if (interaction.customId === 'stand') {

      g.activeHand++;

      if (g.activeHand >= g.hands.length) {
        return resolve(interaction);
      }

      return interaction.update({
        content: render(interaction.user.id, false),
        components: buttons(g.canSplit)
      });
    }

    // DOUBLE
    if (interaction.customId === 'double') {

      let user = await getUser(interaction.user.id);
      if (!user) user = { balance: 1000 };

      if (user.balance < g.amount) {
        return interaction.reply({
          content: '❌ Not enough money.',
          flags: 64
        });
      }

      user.balance -= g.amount;
      await updateUser(interaction.user.id, user);

      g.amount *= 2;

      hand.push(draw());
      g.activeHand++;

      if (g.activeHand >= g.hands.length) {
        return resolve(interaction);
      }

      return interaction.update({
        content: render(interaction.user.id, false),
        components: buttons(g.canSplit)
      });
    }

    // SPLIT
    if (interaction.customId === 'split') {

      if (!g.canSplit || g.split) {
        return interaction.reply({
          content: '❌ Cannot split.',
          flags: 64
        });
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
        components: buttons(false)
      });
    }

  } catch (err) {
    console.error('BLACKJACK BUTTON ERROR:', err);

    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: '❌ Blackjack crashed.',
        flags: 64
      });
    }
  }
}

// =======================
// RESOLVE (FIXED CRASH VERSION)
// =======================
async function resolve(interaction) {
  try {

    const g = games.get(interaction.user.id);

    if (!g) {
      return interaction.reply({
        content: '❌ Game expired.',
        flags: 64
      });
    }

    let user = await getUser(interaction.user.id);
    if (!user) user = { balance: 1000 };

    while (score(g.dealer) < 17) {
      g.dealer.push(draw());
    }

    const dealerScore = score(g.dealer);

    let win = 0;

    for (const hand of g.hands) {
      const s = score(hand);

      if (s > 21) continue;

      if (s > dealerScore || dealerScore > 21) {
        win += g.amount * 2;
      } else if (s === dealerScore) {
        win += g.amount;
      }
    }

    user.balance += win;
    await updateUser(interaction.user.id, user);

    games.delete(interaction.user.id);

    return interaction.update({
      content:
        render(interaction.user.id, true) +
        `\n\n${win > g.amount ? '🎉 WIN' : win === g.amount ? '🤝 PUSH' : '💀 LOSS'}`,
      components: []
    });

  } catch (err) {
    console.error('RESOLVE ERROR:', err);

    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: '❌ Game crashed.',
        flags: 64
      });
    }
  }
}