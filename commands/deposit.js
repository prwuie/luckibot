import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('deposit')
  .setDescription('Deposit money into vault')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const amount = interaction.options.getInteger('amount');

  if (amount > user.balance) {
    return interaction.reply('❌ Not enough money');
  }

  user.balance -= amount;
  user.vault += amount;

  updateUser(interaction.user.id, user);

  return interaction.reply(`🏦 Deposited $${amount} into vault`);
}