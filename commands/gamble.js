import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('gamble')
  .setDescription('50/50 gamble')
  .addStringOption(o =>
    o.setName('amount')
      .setDescription('Amount to gamble (number or "all")')
      .setRequired(true)
  );

export async function execute(interaction) {
  const id = interaction.user.id;
  const amountStr = interaction.options.getString('amount');

  const user = getUser(id);

  let amount;
  if (amountStr.toLowerCase() === 'all') {
    amount = user.balance;
  } else {
    amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return interaction.reply('Invalid amount.');
    }
  }

  if (amount > user.balance) {
    return interaction.reply('Not enough money.');
  }

  const win = Math.random() < 0.5;

  user.balance += win ? amount : -amount;

  updateUser(id, user);

  await interaction.reply(win
    ? `🎉 You won $${amount}`
    : `💀 You lost $${amount}`
  );
}