import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('deposit')
  .setDescription('Store money in your vault')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount to deposit')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const amount = interaction.options.getInteger('amount');

  if (!user.vaultUnlocked) {
    return interaction.reply({ content: '❌ You do not own a Vault.', flags: 64 });
  }

  if (amount <= 0 || amount > user.balance) {
    return interaction.reply({ content: '❌ Invalid amount.', flags: 64 });
  }

  user.balance -= amount;
  user.vault += amount;

  updateUser(interaction.user.id, user);

  return interaction.reply(`🏦 Deposited $${amount} into your vault.`);
}