import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUser } from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('give')
  .setDescription('Give money to another user')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('User to give money to')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Amount to give')
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    const senderId = interaction.user.id;
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    // ❌ cannot give to yourself
    if (target.id === senderId) {
      return interaction.reply({
        content: '❌ You cannot give money to yourself.',
        flags: 64
      });
    }

    // ❌ invalid amount
    if (amount <= 0) {
      return interaction.reply({
        content: '❌ Amount must be greater than 0.',
        flags: 64
      });
    }

    const sender = getUser(senderId);
    const receiver = getUser(target.id);

    // ❌ not enough money
    if (amount > sender.balance) {
      return interaction.reply({
        content: '❌ You do not have enough money.',
        flags: 64
      });
    }

    // 💸 transfer
    sender.balance -= amount;
    receiver.balance += amount;

    updateUser(senderId, sender);
    updateUser(target.id, receiver);

    return interaction.reply({
      content: `💸 You gave **$${amount}** to **${target.username}**.`,
    });

  } catch (err) {
    console.error('GIVE ERROR:', err);

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({
        content: '❌ Transfer failed.',
        flags: 64
      });
    }

    return interaction.reply({
      content: '❌ Transfer failed.',
      flags: 64
    });
  }
}