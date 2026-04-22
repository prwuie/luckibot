import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('withdraw')
  .setDescription('Withdraw money from your vault')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount to withdraw')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const amount = interaction.options.getInteger('amount');

  if (!user.vaultUnlocked) {
    return interaction.reply({ content: '❌ You do not own a Vault.', flags: 64 });
  }

  if (amount <= 0 || amount > user.vault) {
    return interaction.reply({ content: '❌ Invalid amount.', flags: 64 });
  }

  user.vault -= amount;
  user.balance += amount;

  updateUser(interaction.user.id, user);

  return interaction.reply(`💸 Withdrew $${amount} from your vault.`);
}