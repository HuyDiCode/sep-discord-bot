const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { addMeeting } = require("../../utils/meetingManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Schedule a new meeting reminder")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Title of the meeting")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("datetime")
        .setDescription("Date and Time (YYYY-MM-DD HH:MM)")
        .setRequired(true)
    ),
  async execute(interaction) {
    const title = interaction.options.getString("title");
    const datetimeStr = interaction.options.getString("datetime");

    // Parse Date
    const timestamp = Date.parse(datetimeStr);

    if (isNaN(timestamp)) {
      return interaction.reply({
        content:
          "❌ Invalid date format. Please use `YYYY-MM-DD HH:MM` (e.g., 2023-12-25 14:00).",
        ephemeral: true,
      });
    }

    if (timestamp <= Date.now()) {
      return interaction.reply({
        content: "❌ You cannot schedule a meeting in the past!",
        ephemeral: true,
      });
    }

    addMeeting(title, timestamp, interaction.channelId, interaction.user.id);

    const dateObj = new Date(timestamp);
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("📅 Meeting Scheduled")
      .addFields(
        { name: "Title", value: title },
        {
          name: "Time",
          value: `<t:${Math.floor(timestamp / 1000)}:F> (<t:${Math.floor(
            timestamp / 1000
          )}:R>)`,
        },
        { name: "Channel", value: `<#${interaction.channelId}>` }
      )
      .setFooter({ text: `Scheduled by ${interaction.user.username}` });

    return interaction.reply({ embeds: [embed] });
  },
};
