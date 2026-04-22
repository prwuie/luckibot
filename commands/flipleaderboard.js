import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllUsers } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('flipleaderboard')
  .setDescription('Top flip streak players');

function getEmoji(i) {
  if (i === 0) return '👑';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  if (i < 5) return '🔥';
  if (i < 10) return '⚡';
  return '🎲';
}

export async function execute(interaction) {

  const users = getAllUsers();

  const leaderboard = Object.entries(users)
    .map(([id, user]) => ({
      id,
      streak: user.bestFlipStreak || 0
    }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10);

  const desc = leaderboard.map((u, i) => {
    const emoji = getEmoji(i);

    return (
`${emoji} <@${u.id}> — **${u.streak}**`
    );
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🪙 Flip Leaderboard')
    .setColor(0xFFD700)
    .setDescription(desc || 'No data yet');

  return interaction.reply({ embeds: [embed] });
}