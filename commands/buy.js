import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';
import { shopItems } from '../data/shop.js';

export const data = new SlashCommandBuilder()
  .setName('buy')
  .setDescription('Buy shop items')
  .addStringOption(opt =>
    opt.setName('item')
      .setDescription('vault or gun')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const itemId = interaction.options.getString('item');

  const item = shopItems.find(i => i.id === itemId);

  if (!item) {
    return interaction.reply('❌ Item not found.');
  }

  if (user.balance < item.price) {
    return interaction.reply('❌ Not enough money.');
  }

  user.balance -= item.price;

  // -------------------------
  // GUN PURCHASE
  // -------------------------
  if (itemId === 'gun') {
    user.inventory.push('gun');
    user.gun = false; // must be activated via /use
  }

  // -------------------------
  // VAULT PURCHASE
  // -------------------------
  if (itemId === 'vault') {
    user.vaultUnlocked = true;
  }

  updateUser(interaction.user.id, user);

  return interaction.reply(`✅ Purchased **${item.name}**`);
}