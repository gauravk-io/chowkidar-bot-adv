const { Client, GatewayIntentBits, EmbedBuilder, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const sessionMap = new Map(); // userId -> join timestamp
const timeDataPath = path.join(__dirname, 'data', 'timeData.json');
let timeData = loadTimeData();

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const TOKEN = process.env.TOKEN;

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, timeData);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
  }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member;
  const userId = member.id;
  const username = member.user.username;
  const avatarURL = member.user.displayAvatarURL({ dynamic: true });
  const logChannel = await newState.guild.channels.fetch(LOG_CHANNEL_ID);
  const now = Date.now();

  // Joined VC
  if (!oldState.channel && newState.channel) {
    sessionMap.set(userId, now);
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username} joined voice`, iconURL: avatarURL })
      .setDescription(`🔊 Joined **${newState.channel.name}**`)
      .setColor(0x00b0f4)
      .setTimestamp(now);
    logChannel.send({ embeds: [embed] });
  }

  // Left VC
  else if (oldState.channel && !newState.channel) {
    const joinTime = sessionMap.get(userId);
    sessionMap.delete(userId);
    const duration = joinTime ? now - joinTime : 0;
    const seconds = Math.floor(duration / 1000);
    timeData[userId] = (timeData[userId] || 0) + seconds;
    saveTimeData();

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username} left voice`, iconURL: avatarURL })
      .setDescription(`📤 Left **${oldState.channel.name}**\n🕒 Duration: ${formatDuration(duration)}`)
      .setColor(0xf44336)
      .setTimestamp(now);
    logChannel.send({ embeds: [embed] });
  }

  // Moved channels
  else if (oldState.channelId !== newState.channelId) {
    const joinTime = sessionMap.get(userId) || now;
    const duration = now - joinTime;
    const seconds = Math.floor(duration / 1000);
    timeData[userId] = (timeData[userId] || 0) + seconds;
    sessionMap.set(userId, now);
    saveTimeData();

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username} switched channels`, iconURL: avatarURL })
      .setDescription(`🔁 Moved from **${oldState.channel.name}** to **${newState.channel.name}**\n🕒 Time spent: ${formatDuration(duration)}`)
      .setColor(0xff9800)
      .setTimestamp(now);
    logChannel.send({ embeds: [embed] });
  }
});

// Format milliseconds to h:m:s
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

function loadTimeData() {
  try {
    return JSON.parse(fs.readFileSync(timeDataPath));
  } catch {
    return {};
  }
}

function saveTimeData() {
  fs.writeFileSync(timeDataPath, JSON.stringify(timeData, null, 2));
}

client.login(TOKEN);