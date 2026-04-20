import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('withdraw')
  .setDescription('Withdraw from vault')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount')
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = getUser(interaction.user.id);
  const amount = interaction.options.getInteger('amount');

  if (amount > user.vault) {
    return interaction.reply('❌ Not enough in vault');
  }

  user.vault -= amount;
  user.balance += amount;

  updateUser(interaction.user.id, user);

  return interaction.reply(`💰 Withdrew $${amount} from vault`);
}