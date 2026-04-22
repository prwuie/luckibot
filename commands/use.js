import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

const allItems = [
  { name: 'Gun', value: 'gun' },
  { name: 'Lottery Ticket', value: 'lottery_ticket' },
  { name: 'Bounty Token', value: 'bounty_token' }
];

export const data = new SlashCommandBuilder()
  .setName('use')
  .setDescription('Use an item')
  .addStringOption(opt =>
    opt.setName('item')
      .setDescription('Select an item')
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addUserOption(opt =>
    opt.setName('target')
      .setDescription('Target user (for bounty)')
      .setRequired(false)
  );

// =========================
// AUTOCOMPLETE HANDLER
// =========================
export async function autocomplete(interaction) {

  const user = getUser(interaction.user.id);
  const focused = interaction.options.getFocused();

  if (!user.inventory) user.inventory = [];

  // count items
  const counts = {};
  for (const item of user.inventory) {
    counts[item] = (counts[item] || 0) + 1;
  }

  const filtered = allItems
    .filter(i => counts[i.value]) // only owned items
    .filter(i =>
      i.name.toLowerCase().includes(focused.toLowerCase())
    )
    .map(i => ({
      name: `${i.name} (${counts[i.value]})`,
      value: i.value
    }))
    .slice(0, 25);

  await interaction.respond(filtered);
}

// =========================
// EXECUTE
// =========================
export async function execute(interaction) {

  const userId = interaction.user.id;
  const user = getUser(userId);

  const item = interaction.options.getString('item');
  const targetUser = interaction.options.getUser('target');

  if (!user.inventory) user.inventory = [];

  if (!user.inventory.includes(item)) {
    return interaction.reply({
      content: '❌ You do not own this item.',
      flags: 64
    });
  }

  // -------------------------
  // 🔫 GUN
  // -------------------------
  if (item === 'gun') {
    user.gun = true;

    removeOne(user, item);
    updateUser(userId, user);

    return interaction.reply('🔫 Gun activated (1-time protection ready)');
  }

  // -------------------------
  // 🎟️ LOTTERY
  // -------------------------
  if (item === 'lottery_ticket') {

    removeOne(user, item);

    const roll = Math.random() * 100;

    let reward = 0;

    if (roll < 1) reward = 20000;
    else if (roll < 5) reward = 5000;
    else if (roll < 30) reward = 2000;

    user.balance += reward;

    updateUser(userId, user);

    if (reward === 0) {
      return interaction.reply('🎟️ You lost the lottery...');
    }

    return interaction.reply(`🎟️ You won $${reward}!`);
  }

  // -------------------------
  // 🎯 BOUNTY TOKEN
  // -------------------------
  if (item === 'bounty_token') {

    if (!targetUser) {
      return interaction.reply({
        content: '❌ You must specify a target.',
        flags: 64
      });
    }

    if (targetUser.id === userId) {
      return interaction.reply({
        content: '❌ You cannot bounty yourself.',
        flags: 64
      });
    }

    const target = getUser(targetUser.id);

    target.bountyOn = userId;

    removeOne(user, item);

    updateUser(userId, user);
    updateUser(targetUser.id, target);

    return interaction.reply(
      `🎯 Bounty placed on **${targetUser.username}**!\nYou get 50% of the next steal.`
    );
  }

  return interaction.reply('❌ Unknown item.');
}

// =========================
// REMOVE ONE ITEM
// =========================
function removeOne(user, item) {
  const index = user.inventory.indexOf(item);
  if (index > -1) {
    user.inventory.splice(index, 1);
  }
}