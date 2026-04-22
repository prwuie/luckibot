import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('steal')
  .setDescription('Attempt to steal money from someone')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('Target user')
      .setRequired(true)
  );

export async function execute(interaction) {
  const thiefId = interaction.user.id;
  const targetUserObj = interaction.options.getUser('user');

  if (targetUserObj.id === thiefId) {
    return interaction.reply({
      content: '❌ You cannot steal from yourself.',
      flags: 64
    });
  }

  const thief = getUser(thiefId);
  const target = getUser(targetUserObj.id);

  if (target.balance <= 0) {
    return interaction.reply({
      content: '❌ This user has no money to steal.',
      flags: 64
    });
  }

  // =========================
  // 🎯 DYNAMIC SUCCESS RATE
  // =========================

  // base chance
  let successChance = 0.35;

  // scale with target wallet (log-based so it doesn't explode)
  successChance += Math.log10(target.balance + 1) * 0.1;

  // clamp between 35% and 85%
  successChance = Math.min(Math.max(successChance, 0.35), 0.85);

  const success = Math.random() < successChance;

  // =========================
  // 💸 STEAL AMOUNT
  // =========================
  const maxSteal = Math.floor(target.balance * 0.4);
  const amount = Math.max(1, Math.floor(Math.random() * maxSteal));

  if (!success) {
    return interaction.reply(
      `💀 You failed to steal.\n📊 Success chance was ${(successChance * 100).toFixed(1)}%`
    );
  }

  // =========================
  // 🎯 BOUNTY SYSTEM
  // =========================
  let thiefGain = amount;

  if (target.bountyOn) {
    const bountyOwner = getUser(target.bountyOn);

    const split = Math.floor(amount / 2);

    thiefGain = split;
    bountyOwner.balance += split;

    updateUser(target.bountyOn, bountyOwner);

    target.bountyOn = null;
  }

  // =========================
  // 💰 APPLY CHANGES
  // =========================
  target.balance -= amount;
  thief.balance += thiefGain;

  updateUser(thiefId, thief);
  updateUser(targetUserObj.id, target);

  return interaction.reply(
    `🕵️ You stole **$${thiefGain}** from **${targetUserObj.username}**!\n📊 Success chance: ${(successChance * 100).toFixed(1)}%`
  );
}