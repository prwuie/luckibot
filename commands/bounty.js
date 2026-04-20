import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('bounty')
  .setDescription('Place a bounty on a user')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('Target user')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const target = interaction.options.getUser('user');

  if (target.bot || target.id === interaction.user.id) {
    return interaction.reply('❌ Invalid target.');
  }

  if (!user.inventory.includes('bounty_token')) {
    return interaction.reply('❌ You do not own a bounty token.');
  }

  user.inventory = user.inventory.filter(i => i !== 'bounty_token');
  user.bountyOn = target.id;

  updateUser(interaction.user.id, user);

  return interaction.reply(`🎯 Bounty placed on ${target.username}`);
}