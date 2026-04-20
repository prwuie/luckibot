import { SlashCommandBuilder } from 'discord.js';
import { getAllUsers } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Show richest players');

export async function execute(interaction) {
  const db = getAllUsers();

  const sorted = Object.entries(db)
    .map(([id, data]) => ({
      id,
      balance: data.balance ?? 0
    }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  let msg = '🏆 **TOP RICHEST PLAYERS**\n\n';

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    const user = await interaction.client.users.fetch(entry.id).catch(() => null);

    const name = user ? user.username : 'Unknown User';

    const medal =
      i === 0 ? '🥇' :
      i === 1 ? '🥈' :
      i === 2 ? '🥉' :
      `#${i + 1}`;

    msg += `${medal} **${name}** — 💰 $${entry.balance}\n`;
  }

  return interaction.reply(msg);
}