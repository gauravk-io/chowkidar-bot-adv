const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Shows top 10 users by time spent in chitchat'),
  async execute(interaction, timeData) {
    const sorted = Object.entries(timeData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const rows = await Promise.all(
      sorted.map(async ([userId, seconds], index) => {
        const user = await interaction.client.users.fetch(userId).catch(() => null);
        const name = user ? user.username : `Unknown (${userId})`;
        const time = formatDuration(seconds * 1000);
        return `**${index + 1}.** ${name} - ${time}`;
      })
    );

    const embed = new EmbedBuilder()
      .setTitle('🏆 Chitchat Leaderboard')
      .setDescription(rows.join('\n') || 'No data yet.')
      .setColor(0x00b0f4);

    await interaction.reply({ embeds: [embed] });
  }
};

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}
