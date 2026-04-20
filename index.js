import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// ===============================
// 🧠 SAFE REPLY HELPER
// ===============================
async function safeReply(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(payload);
    }
    return await interaction.reply(payload);
  } catch (err) {
    console.error('safeReply error:', err);
  }
}

// ===============================
// 📦 COMMAND LOADER (FIXED)
// ===============================
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of files) {
  try {
    const commandModule = await import(`./commands/${file}`);

    const command = commandModule.default ?? commandModule;

    const data = command.data ?? command;

    if (!data) {
      console.log(`❌ Invalid command file: ${file}`);
      continue;
    }

    const name = data.name ?? data.toJSON?.()?.name;

    if (!name || !command.execute) {
      console.log(`❌ Missing data/execute in: ${file}`);
      continue;
    }

    client.commands.set(name, command);

    console.log(`✅ Loaded command: ${name}`);

  } catch (err) {
    console.log(`❌ Failed loading ${file}:`, err);
  }
}

// ===============================
// READY EVENT
// ===============================
client.once('clientReady', () => {
  console.log(`🎰 Bot online as ${client.user.tag}`);
  console.log(`📊 Commands loaded: ${client.commands.size}`);
});

// ===============================
// INTERACTION HANDLER
// ===============================
client.on('interactionCreate', async interaction => {

  // ===============================
  // 🃏 BLACKJACK BUTTONS FIXED
  // ===============================
  if (interaction.isButton()) {
    try {

      const blackjackModule = await import('./commands/blackjack.js');

      const blackjack =
        blackjackModule.default ??
        blackjackModule;

      const handler =
        blackjackModule.handleBlackjackButtons ??
        blackjack.handleBlackjackButtons;

      if (typeof handler !== 'function') {
        console.error('❌ Blackjack handler missing');

        return safeReply(interaction, {
          content: '❌ Blackjack system error.',
          flags: 64
        });
      }

      return handler(interaction);

    } catch (err) {
      console.error('Blackjack button error:', err);

      return safeReply(interaction, {
        content: '❌ Error handling blackjack button.',
        flags: 64
      });
    }
  }

  // ===============================
  // SLASH COMMANDS
  // ===============================
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    return safeReply(interaction, {
      content: '❌ Command not found.',
      flags: 64
    });
  }

  try {
    await command.execute(interaction);

  } catch (error) {
    console.error('❌ Command error:', error);

    return safeReply(interaction, {
      content: '❌ An error occurred.',
      flags: 64
    });
  }
});

// ===============================
// LOGIN
// ===============================
client.login(process.env.DISCORD_TOKEN);