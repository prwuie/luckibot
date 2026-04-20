import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

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

  if (!command?.data?.name || !command?.execute) {
    console.log(`❌ Invalid command file: ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
}

// ===============================
// READY EVENT
// ===============================
client.once('ready', () => {
  console.log(`🎰 Lucki is online as ${client.user.tag}`);
  console.log(`📊 Commands loaded: ${client.commands.size}`);
});

// ===============================
// INTERACTION HANDLER
// ===============================
client.on('interactionCreate', async interaction => {

  // ===============================
  // 🃏 BUTTON HANDLER (BLACKJACK)
  // ===============================
  if (interaction.isButton()) {
    try {
      const blackjack = await import('./commands/blackjack.js');
      return blackjack.handleBlackjackButtons(interaction);
    } catch (err) {
      console.error('Blackjack button error:', err);

      return interaction.reply({
        content: '❌ Error handling blackjack button.',
        ephemeral: true
      });
    }
  }

  // ===============================
  // SLASH COMMANDS
  // ===============================
  if (!interaction.isChatInputCommand()) return;

  console.log('➡️ Command:', interaction.commandName);

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log('❌ Command not found:', interaction.commandName);

    return interaction.reply({
      content: '❌ Command not found.',
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction);
    console.log('✅ Executed:', interaction.commandName);

  } catch (error) {
    console.error('❌ Command error:', error);

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply('❌ An error occurred.');
      } else {
        await interaction.reply({
          content: '❌ An error occurred.',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('❌ Failed to send error message:', e);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);