import { SlashCommandBuilder } from 'discord.js';
import { shopItems } from '../data/shop.js';

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('View casino shop');

export async function execute(interaction) {
  let msg = '🛒 **CASINO SHOP**\n\n';

  for (const item of shopItems) {
    msg += `🎰 **${item.name}**\n💰 $${item.price}\n📝 ${item.description}\n\n`;
  }

  return interaction.reply(msg);
}