import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('removemoney')
  .setDescription('Remove money from a user (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('User to remove money from')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount to remove')
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

    const user = getUser(targetUser.id);

    if (amount <= 0) {
      return interaction.reply({
        content: '❌ Amount must be positive.',
        ephemeral: false
      });
    }

    if (amount > user.balance) {
      return interaction.reply({
        content: '❌ Cannot remove more than user balance.',
        ephemeral: false
      });
    }

    user.balance -= amount;
    updateUser(targetUser.id, user);

    return interaction.reply(
      `🛠️ ADMIN ACTION\n` +
      `👤 User: ${targetUser.username}\n` +
      `➖ Removed: $${amount}\n` +
      `💰 New Balance: $${user.balance}`
    );

  } catch (error) {
    console.error('removemoney error:', error);

    return interaction.reply({
      content: '❌ Error occurred while processing command.',
      ephemeral: false
    });
  }
}