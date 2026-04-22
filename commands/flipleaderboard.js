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
      streak: user.bestFlipStreak ?? 0   // ✅ FIXED SAFE READ
    }))
    .filter(u => u.streak > 0) // optional: hides empty users
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10);

  if (leaderboard.length === 0) {
    return interaction.reply({
      content: 'No flip streaks recorded yet 🎲',
      flags: 64
    });
  }

  const desc = leaderboard.map((u, i) => {
    const emoji = getEmoji(i);

    return `${emoji} <@${u.id}> — **${u.streak}**`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🪙 Flip Leaderboard')
    .setColor(0xFFD700)
    .setDescription(desc)
    .setFooter({ text: 'Keep flipping to climb the ranks 🎲' });

  return interaction.reply({ embeds: [embed] });
}