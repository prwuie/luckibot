import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';
import { shopItems } from '../data/shop.js';

// 🔥 build dropdown choices dynamically
const choices = shopItems.map(item => ({
  name: `${item.name} ($${item.price})`,
  value: item.id
}));

export const data = new SlashCommandBuilder()
  .setName('buy')
  .setDescription('Buy shop items')
  .addStringOption(opt => {
    opt.setName('item')
      .setDescription('Select an item to buy')
      .setRequired(true);

    // 👇 add all shop items to dropdown
    for (const choice of choices) {
      opt.addChoices(choice);
    }

    return opt;
  });

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const itemId = interaction.options.getString('item');

  const item = shopItems.find(i => i.id === itemId);

  if (!item) {
    return interaction.reply({ content: '❌ Item not found.', flags: 64 });
  }

  if (user.balance < item.price) {
    return interaction.reply({ content: '❌ Not enough money.', flags: 64 });
  }

  if (!user.inventory) user.inventory = [];

  user.balance -= item.price;

  // -------------------------
  // GUN
  // -------------------------
  if (itemId === 'gun') {
    user.inventory.push('gun');
    user.gun = false;
  }

  // -------------------------
  // VAULT
  // -------------------------
  if (itemId === 'vault') {
    user.vaultUnlocked = true;
  }

  // -------------------------
  // 🎯 BOUNTY TOKEN
  // -------------------------
  if (itemId === 'bounty_token') {
    user.inventory.push('bounty_token');
  }

  // -------------------------
  // 🎟️ LOTTERY TICKET
  // -------------------------
  if (itemId === 'lottery_ticket') {
    user.inventory.push('lottery_ticket');
  }

  updateUser(interaction.user.id, user);

  return interaction.reply({
    content: `🛒 Purchased **${item.name}** for $${item.price}`
  });
}