import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser, getUserDirect } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('steal')
  .setDescription('Try to steal money from a user')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('Target user')
      .setRequired(true)
  );

export async function execute(interaction) {
  const thiefId = interaction.user.id;
  const targetUser = interaction.options.getUser('user');

  if (targetUser.bot || targetUser.id === thiefId) {
    return interaction.reply('❌ Invalid target.');
  }

  const thief = getUser(thiefId);
  const victim = getUser(targetUser.id);

  const now = Date.now();
  const cooldown = 30 * 60 * 1000;

  if (now - thief.lastSteal < cooldown) {
    const mins = Math.ceil((cooldown - (now - thief.lastSteal)) / 60000);
    return interaction.reply(`⏳ Wait ${mins} minute(s).`);
  }

  thief.lastSteal = now;

  if (victim.balance <= 0) {
    updateUser(thiefId, thief);
    return interaction.reply('❌ Target has no money.');
  }

  if (Math.random() * 100 > 35) {
    updateUser(thiefId, thief);
    return interaction.reply(`💀 ${interaction.user.username} failed to steal from ${targetUser.username}`);
  }

  const percent = Math.floor(Math.random() * 21) + 5;
  let stolen = Math.floor(victim.balance * (percent / 100));

  // -------------------------
  // GUN SYSTEM
  // -------------------------
  if (victim.gun) {
    const trigger = Math.random() < 0.5;

    if (trigger) {
      const percentFromThief = Math.floor(Math.random() * 25) + 10;
      const counter = Math.floor(Math.abs(thief.balance) * (percentFromThief / 100)) + 200;

      thief.balance -= counter;
      victim.balance += counter;
      victim.gun = false;

      updateUser(thiefId, thief);
      updateUser(targetUser.id, victim);

      return interaction.reply(
        `🔫 ${targetUser.username} shoots ${interaction.user.username}!\n` +
        `💥 ${targetUser.username} steals $${counter} from ${interaction.user.username}`
      );
    } else {
      victim.gun = false;

      victim.balance -= stolen;
      thief.balance += stolen;

      updateUser(thiefId, thief);
      updateUser(targetUser.id, victim);

      return interaction.reply(
        `🔫 ${targetUser.username}'s gun jams!\n` +
        `🥷 ${interaction.user.username} steals $${stolen} from ${targetUser.username}`
      );
    }
  }

  // -------------------------
  // BOUNTY SYSTEM
  // -------------------------
  if (victim.bountyOn === thiefId) {
    const split = Math.floor(stolen / 2);
    const bountyOwner = getUserDirect(victim.bountyOn);

    thief.balance += split;
    bountyOwner.balance += split;

    victim.balance -= stolen;

    updateUser(thiefId, thief);
    updateUser(targetUser.id, victim);
    updateUser(victim.bountyOn, bountyOwner);

    return interaction.reply(
      `🎯 BOUNTY ACTIVE!\n` +
      `${interaction.user.username} steals $${split} from ${targetUser.username}\n` +
      `💰 Bounty owner receives $${split}`
    );
  }

  // -------------------------
  // NORMAL STEAL
  // -------------------------
  victim.balance -= stolen;
  thief.balance += stolen;

  updateUser(thiefId, thief);
  updateUser(targetUser.id, victim);

  return interaction.reply(
    `🥷 ${interaction.user.username} steals $${stolen} from ${targetUser.username}`
  );
}