import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.commands = new Collection();

// ===============================
// SAFE REPLY
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
// COMMAND LOADER
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
// READY
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
  // 🛒 SHOP DROPDOWN HANDLER
  // ===============================
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === 'shop_select') {

      try {
        const itemId = interaction.values[0];

        const { shopItems } = await import('./data/shop.js');
        const { getUser, updateUser } = await import('./utils/db.js');

        const item = shopItems.find(i => i.id === itemId);
        const user = getUser(interaction.user.id);

        if (!item) {
          return interaction.reply({ content: '❌ Item not found.', flags: 64 });
        }

        if (user.balance < item.price) {
          return interaction.reply({ content: '❌ Not enough money.', flags: 64 });
        }

        user.balance -= item.price;

        if (!user.inventory) user.inventory = [];

        if (itemId === 'gun') user.inventory.push('gun');
        if (itemId === 'bounty_token') user.inventory.push('bounty_token');
        if (itemId === 'lottery_ticket') user.inventory.push('lottery_ticket');
        if (itemId === 'vault') user.vaultUnlocked = true;

        updateUser(interaction.user.id, user);

        return interaction.reply({
          content: `🛒 Purchased **${item.name}** for $${item.price}`,
          flags: 64
        });

      } catch (err) {
        console.error('Shop error:', err);
      }
    }
  }

  // ===============================
  // 🔘 BUTTON HANDLERS (FLIP + BLACKJACK)
  // ===============================
  if (interaction.isButton()) {

    try {

      const flipModule = await import('./commands/flip.js');
      const blackjackModule = await import('./commands/blackjack.js');

      const flipHandler = flipModule.handleFlipButtons;
      const blackjackHandler = blackjackModule.handleBlackjackButtons;

      const id = interaction.customId;

      // 🎰 FLIP SYSTEM
      if (
        id === 'continue' ||
        id === 'cashout' ||
        id === 'heads' ||
        id === 'tails'
      ) {
        return flipHandler(interaction);
      }

      // 🃏 BLACKJACK SYSTEM
      if (typeof blackjackHandler === 'function') {
        return blackjackHandler(interaction);
      }

    } catch (err) {
      console.error('Button error:', err);

      return safeReply(interaction, {
        content: '❌ Button system error.',
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