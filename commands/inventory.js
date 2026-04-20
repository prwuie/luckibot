import { SlashCommandBuilder } from 'discord.js';
import { getUser } from '../utils/db.js';
import { shopItems } from '../data/shop.js';

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('View your items');

export async function execute(interaction) {
  const user = getUser(interaction.user.id);

  if (!user.inventory.length) {
    return interaction.reply('🎒 You own nothing');
  }

  let msg = '🎒 **YOUR INVENTORY**\n\n';

  for (const id of user.inventory) {
    const item = shopItems.find(i => i.id === id);
    if (item) msg += `• ${item.name}\n`;
  }

  return interaction.reply(msg);
}