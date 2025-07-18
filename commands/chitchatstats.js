const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chitchatstats')
    .setDescription('Shows your total time spent in voice chat'),
  async execute(interaction, timeData) {
    const userId = interaction.user.id;
    const totalSec = timeData[userId] || 0;
    const duration = formatDuration(totalSec * 1000);

    await interaction.reply({
      content: `🕒 You've spent **${duration}** in chitchat.`,
      ephemeral: true
    });
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
