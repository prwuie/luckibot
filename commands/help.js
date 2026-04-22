import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all commands and how to use them');

export async function execute(interaction) {

  const embed = new EmbedBuilder()
    .setTitle('🎰 Lucki Bot Commands')
    .setColor(0x00AE86)
    .setDescription('Here are all available commands:')

    // 💰 ECONOMY
    .addFields(
      {
        name: '💰 Economy',
        value:
`/balance → Check your money
/work → Earn money (5 min cooldown)
/deposit <amount> → Store money in vault (if owned)
/withdraw <amount> → Take money from vault
`,
      },

      // 🎰 GAMBLING
      {
        name: '🎰 Gambling',
        value:
`/slots <amount> → Play slots
/blackjack <amount> → Play blackjack
/flip <amount> <heads/tails> → High-risk streak coin flip (NEW)
`,
      },

      // 🪙 FLIP GAME INFO
      {
        name: '🪙 Flip System (NEW)',
        value:
`• Build streaks for higher multipliers
• Continue = risk streak
• Cashout = secure winnings
• Lose once = lose entire streak
• 15s timeout = automatic loss
• Rare lucky boosts available 🍀
`,
      },

      // 🥷 CRIME
      {
        name: '🥷 Crime',
        value:
`/steal <user> → Attempt to steal money (wallet only)
/bounty <user> → Place bounty on a user (item-based)
`,
      },

      // 🛒 SHOP
      {
        name: '🛒 Shop / Items',
        value:
`/shop → View items
/buy <item> → Buy item (now dropdown)
/use <item> → Use items

🎒 Items:
• Gun → protection / crime utility
• Vault → store money safely
• Bounty Token → place bounty
• Lottery Ticket → gamble item
`,
      },

      // 🏦 VAULT SYSTEM
      {
        name: '🏦 Vault System',
        value:
`• Vault protects money from /steal
• Requires Vault item to use
• View balance with /balance
`,
      },

      // ⚙️ ADMIN
      {
        name: '⚙️ Admin',
        value:
`/addmoney <user> <amount>
/removemoney <user> <amount>
/setmoney <user> <amount>
`,
      }
    )

    .setFooter({ text: 'Lucki Bot • Gamble responsibly 🎲' });

  await interaction.reply({ embeds: [embed] });
}