import { SlashCommandBuilder } from 'discord.js';
import { getUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('checkbalance')
  .setDescription('Check the balance of yourself or another user')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('User to check the balance of')
      .setRequired(false)
  );

export async function execute(interaction) {
  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const user = getUser(targetUser.id);

    await interaction.reply(`💰 ${targetUser.username} has **$${user.balance}**`);
  } catch (error) {
    console.error('Error in checkbalance:', error);
    await interaction.reply({
      content: 'An error occurred while processing the command.',
flags: 64    
});
  }
}
