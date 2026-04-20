import { SlashCommandBuilder } from 'discord.js';
import { getUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Check your money');

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  await interaction.reply(`💰 You have **$${user.balance}**`);
}