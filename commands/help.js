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
`,
      },

      // 🎰 GAMBLING
      {
        name: '🎰 Gambling',
        value:
`/slots <amount> → Play slots
/blackjack <amount> → Play blackjack
`,
      },

      // 🥷 CRIME
      {
        name: '🥷 Crime',
        value:
`/steal <user> → Attempt to steal money (30 min cooldown)
`,
      },

      // 🛒 SHOP
      {
        name: '🛒 Shop',
        value:
`/shop → View items
/buy <item> → Buy item
/use <item> → Use item
`,
      },

      // 🎯 SPECIAL
      {
        name: '🎯 Special',
        value:
`/bounty <user> → Place bounty on a user
`,
      },

      // ⚙️ ADMIN
      {
        name: '⚙️ Admin',
        value:
`/addmoney <user> <amount>
/removemoney <user> <amount>
`,
      }
    )

    .setFooter({ text: 'Lucki Bot • Gamble responsibly 🎲' });

  await interaction.reply({ embeds: [embed] });
}