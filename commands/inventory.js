import { SlashCommandBuilder } from 'discord.js';
import { getUser } from '../utils/db.js';
import { shopItems } from '../data/shop.js';

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('View your inventory');

// 🎨 emoji map
const itemEmojis = {
  gun: '🔫',
  vault: '🏦',
  bounty_token: '🎯',
  lottery_ticket: '🎟️'
};

export async function execute(interaction) {
  const user = getUser(interaction.user.id);

  const inventory = user.inventory || [];

  // 🧠 stack items
  const counts = {};
  for (const item of inventory) {
    counts[item] = (counts[item] || 0) + 1;
  }

  // 🏷️ format items with emojis
  const formattedItems = Object.entries(counts).map(([id, amount]) => {
    const itemData = shopItems.find(i => i.id === id);
    const name = itemData ? itemData.name : id;

    const emoji = itemEmojis[id] || '📦';

    return `${emoji} ${name} x${amount}`;
  });

  const inventoryText = formattedItems.length > 0
    ? formattedItems.join('\n')
    : 'Empty';

  // 🏦 vault display
  const vaultStatus = user.vaultUnlocked
    ? `🏦 Vault: $${user.vault || 0}`
    : `🏦 Vault: ❌ Not owned`;

  return interaction.reply({
    content:
`🎒 **INVENTORY**

${inventoryText}

${vaultStatus}`
  });
}