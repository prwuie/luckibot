import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('use')
  .setDescription('Use an item')
  .addStringOption(opt =>
    opt.setName('item')
      .setDescription('Item name')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const item = interaction.options.getString('item');

  // -------------------------
  // GUN
  // -------------------------
  if (item === 'gun') {
    if (!user.inventory.includes('gun')) {
      return interaction.reply('❌ You do not own a gun.');
    }

    user.gun = true;
    updateUser(interaction.user.id, user);

    return interaction.reply('🔫 Gun activated (1-time protection ready)');
  }

  // -------------------------
  // LOTTERY
  // -------------------------
  if (item === 'lottery_ticket') {
    if (!user.inventory.includes('lottery_ticket')) {
      return interaction.reply('❌ You do not own a lottery ticket.');
    }

    user.inventory = user.inventory.filter(i => i !== 'lottery_ticket');

    const roll = Math.random() * 100;

    let reward = 0;

    if (roll < 1) reward = 20000;
    else if (roll < 5) reward = 5000;
    else if (roll < 30) reward = 2000;

    user.balance += reward;

    updateUser(interaction.user.id, user);

    if (reward === 0) {
      return interaction.reply('🎟️ You lost the lottery...');
    }

    return interaction.reply(`🎟️ You won $${reward}!`);
  }

  return interaction.reply('❌ Unknown item.');
}