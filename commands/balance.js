import { SlashCommandBuilder } from 'discord.js';
import { getUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Check your balance');

export async function execute(interaction) {
  const user = getUser(interaction.user.id);

  return interaction.reply({
    content: `💰 Wallet: $${user.balance}\n🏦 Vault: $${user.vault}`
  });
}