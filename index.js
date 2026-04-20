import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import * as blackjack from './commands/blackjack.js';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// ===============================
// 📦 LOAD COMMANDS
// ===============================
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of files) {
  const commandModule = await import(`./commands/${file}`);
  const command = commandModule.default ?? commandModule;

  if (!command?.data || !command?.execute) {
    console.log(`❌ Invalid command file: ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
}

// ===============================
// READY
// ===============================
client.once('ready', () => {
  console.log(`🎰 Bot online as ${client.user.tag}`);
  console.log(`📊 Commands loaded: ${client.commands.size}`);
});

// ===============================
// INTERACTIONS
// ===============================
client.on('interactionCreate', async interaction => {

  // ===============================
  // 🃏 BLACKJACK BUTTONS
  // ===============================
  if (interaction.isButton()) {
    const valid = ['hit', 'stand', 'double', 'split'];

    if (valid.includes(interaction.customId)) {
      try {
        return await blackjack.handleBlackjackButtons(interaction);
      } catch (err) {
        console.error('Blackjack error:', err);

        if (!interaction.replied && !interaction.deferred) {
          return interaction.reply({
            content: '❌ Blackjack error occurred.',
            ephemeral: true
          });
        }
      }
    }
    return;
  }

  // ===============================
  // SLASH COMMANDS
  // ===============================
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    return interaction.reply({
      content: '❌ Command not found.',
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction);
    console.log(`✅ Executed ${interaction.commandName}`);

  } catch (error) {
    console.error('❌ Command error:', error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Error occurred.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ Error occurred.',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);