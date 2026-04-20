import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Claim daily reward');

export async function execute(interaction) {
  const id = interaction.user.id;
  const user = getUser(id);

  const now = Date.now();
  const day = 86400000;

  if (now - user.lastDaily < day) {
    return interaction.reply({ content: 'Already claimed daily.', ephemeral: true });
  }

  // streak logic
  if (now - user.lastDaily < day * 2) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }

  const base = 300 + Math.floor(Math.random() * 400);
  const bonus = 1 + user.streak * 0.1;

  const reward = Math.floor(base * bonus);

  user.balance += reward;
  user.lastDaily = now;

  updateUser(id, user);

  await interaction.reply(
    `💵 Daily: +$${reward}\n🔥 Streak: ${user.streak}`
  );
}