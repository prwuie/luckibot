import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('setmoney')
  .setDescription('Set a user\'s balance to a specific amount (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('User to set the balance for')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount to set')
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (amount < 0) {
      return interaction.editReply({
        content: 'Amount must be zero or greater.'
      });
    }

    const user = getUser(targetUser.id);
    user.balance = amount;
    updateUser(targetUser.id, user);

    await interaction.editReply(`✅ Set ${targetUser.username}'s balance to $${amount}.`);
  } catch (error) {
    console.error('Error in setmoney:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: 'An error occurred while processing the command.'
      });
    } else {
      await interaction.reply({
        content: 'An error occurred while processing the command.',
flags: 64    
  });
    }
  }
}
