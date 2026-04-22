import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder
} from 'discord.js';

import { shopItems } from '../data/shop.js';

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('Open the shop');

export async function execute(interaction) {

  const embed = new EmbedBuilder()
    .setTitle('🛒 Shop')
    .setColor(0x00AE86)
    .setDescription(
      shopItems.map(i =>
        `🛍️ **${i.name}** - $${i.price}\n${i.description}`
      ).join('\n\n')
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId('shop_select')
    .setPlaceholder('Select an item to buy')
    .addOptions(
      shopItems.slice(0, 25).map(item => ({
        label: item.name,
        description: `$${item.price}`,
        value: item.id
      }))
    );

  const row = new ActionRowBuilder().addComponents(menu);

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}