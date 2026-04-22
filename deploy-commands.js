import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// ===============================
// LOAD COMMANDS
// ===============================
for (const file of commandFiles) {
  try {
    const commandModule = await import(`./commands/${file}`);
    const command = commandModule.default ?? commandModule;

    if (!command?.data || !command.execute) {
      console.log(`❌ Skipping invalid command: ${file}`);
      continue;
    }

    commands.push(command.data.toJSON());
    console.log(`✅ Loaded: ${command.data.name}`);

  } catch (err) {
    console.log(`❌ Error loading ${file}:`, err);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// ===============================
// DEPLOY GLOBAL COMMANDS
// ===============================
try {
  console.log('🌍 Deploying GLOBAL commands...');

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log('✅ Global commands deployed successfully!');
  console.log('⏱️ It can take up to 1 hour to appear everywhere.');

} catch (error) {
  console.error('❌ Deploy error:', error);
}