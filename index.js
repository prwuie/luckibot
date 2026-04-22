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
// 📦 COMMAND LOADER (FIXED PROPERLY)
// ===============================
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of files) {
  try {
    const command = await import(`./commands/${file}`);

    const data = command.data;

    const name = data?.name ?? data?.toJSON?.()?.name;

    // ❌ HARD VALIDATION (REAL FIX)
    if (!data || !command.execute) {
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
// READY EVENT (FIXED NAME)
// ===============================
client.once('ready', () => {
  console.log(`🎰 Bot online as ${client.user.tag}`);
  console.log(`📊 Commands loaded: ${client.commands.size}`);
});

// ===============================
// INTERACTION HANDLER
// ===============================
client.on('interactionCreate', async interaction => {

  // ===============================
  // 🔘 BUTTON ROUTER
  // ===============================
  if (interaction.isButton()) {
    try {

      // import once per handler call (safe + simple)
      const blackjack = await import('./commands/blackjack.js');
      const flip = await import('./commands/flip.js');

      const blackjackHandler = blackjack.handleBlackjackButtons;
      const flipHandler = flip.handleFlipButtons;

      // 🃏 BLACKJACK BUTTONS
      if (
        ['hit', 'stand', 'double', 'split'].includes(interaction.customId)
      ) {
        if (typeof blackjackHandler === 'function') {
          return blackjackHandler(interaction);
        }

        return safeReply(interaction, {
          content: '❌ Blackjack system error.',
          flags: 64
        });
      }

      // 🪙 FLIP BUTTONS
      if (
        ['continue', 'cashout'].includes(interaction.customId)
      ) {
        if (typeof flipHandler === 'function') {
          return flipHandler(interaction);
        }

        return safeReply(interaction, {
          content: '❌ Flip system error.',
          flags: 64
        });
      }

    } catch (err) {
      console.error('Button error:', err);

      return safeReply(interaction, {
        content: '❌ Button handling error.',
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