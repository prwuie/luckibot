import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

const COOLDOWN = 30 * 60 * 1000; // 30 minutes

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

  // =========================
  // 🧠 COOLDOWN FIX (ONLY ADDITION)
  // =========================
  if (!thief.lastSteal) {
    thief.lastSteal = 0;
  }

  const now = Date.now();

  if (now - thief.lastSteal < COOLDOWN) {
    const remaining = COOLDOWN - (now - thief.lastSteal);

    return interaction.reply({
      content: `⏳ You are on cooldown! Try again in **${Math.ceil(remaining / 60000)} minutes**.`,
      flags: 64
    });
  }

  if (target.balance <= 0) {
    return interaction.reply({
      content: '❌ This user has no money to steal.',
      flags: 64
    });
  }

  // =========================
  // 🎯 ORIGINAL SCALING (RESTORED)
  // =========================
  let successChance = 0.35;

  successChance += Math.log10(target.balance + 1) * 0.1;

  successChance = Math.min(Math.max(successChance, 0.35), 0.85);

  const success = Math.random() < successChance;

  // =========================
  // 💸 STEAL AMOUNT
  // =========================
  const maxSteal = Math.floor(target.balance * 0.4);
  const amount = Math.max(1, Math.floor(Math.random() * maxSteal));

  // =========================
  // 💀 FAIL CASE
  // =========================
  if (!success) {

    thief.lastSteal = now;
    updateUser(thiefId, thief);

    return interaction.reply(
`💀 You failed to steal.
📊 Success chance was ${(successChance * 100).toFixed(1)}%`
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

  // =========================
  // ⏳ SAVE COOLDOWN (ONLY ADDITION)
  // =========================
  thief.lastSteal = now;

  updateUser(thiefId, thief);
  updateUser(targetUserObj.id, target);

  return interaction.reply(
`🕵️ You stole **$${thiefGain}** from **${targetUserObj.username}**
📊 Success chance: ${(successChance * 100).toFixed(1)}%`
  );
}