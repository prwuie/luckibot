import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('addmoney')
  .setDescription('Add money to a user (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('User to add money to')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount to add')
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ You need Administrator permissions.',
        ephemeral: false
      });
    }

    if (amount <= 0) {
      return interaction.reply({
        content: '❌ Amount must be positive.',
        ephemeral: false
      });
    }

    const user = getUser(targetUser.id);
    user.balance += amount;
    updateUser(targetUser.id, user);

    return interaction.reply(
      `🛠️ ADMIN ACTION\n` +
      `👤 User: ${targetUser.username}\n` +
      `➕ Added: $${amount}\n` +
      `💰 New Balance: $${user.balance}`
    );

  } catch (error) {
    console.error('addmoney error:', error);

    return interaction.reply({
      content: '❌ Error occurred while processing command.',
      ephemeral: false
    });
  }
}