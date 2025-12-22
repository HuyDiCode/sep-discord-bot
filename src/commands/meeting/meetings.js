const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getMeetings, removeMeeting } = require("../../utils/meetingManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meetings")
    .setDescription("List or manage upcoming meetings")
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all upcoming meetings")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("cancel")
        .setDescription("Cancel a scheduled meeting")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription(
              "The ID of the meeting to cancel (found in /meetings list)"
            )
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const meetingsData = getMeetings();

    if (subcommand === "list") {
      const upcoming = meetingsData.upcoming;
      const daily = meetingsData.daily;

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("🗓️ Scheduled Meetings");

      // Daily Section
      if (daily.enabled) {
        embed.addFields({
          name: "🔄 Daily Meeting",
          value: `🕒 **${daily.time}** in <#${daily.channelId}>`,
        });
      } else {
        embed.addFields({
          name: "🔄 Daily Meeting",
          value: "Not set. Use `/daily set` to enable.",
        });
      }

      // Upcoming Section
      if (upcoming.length === 0) {
        embed.addFields({
          name: "Upcoming Meetings",
          value: "No upcoming meetings scheduled.",
        });
      } else {
        const meetingList = upcoming
          .map((m) => {
            return `**ID:** \`${m.id}\`\n**Title:** ${
              m.title
            }\n**Time:** <t:${Math.floor(
              m.timestamp / 1000
            )}:F>\n**Channel:** <#${m.channelId}>\n`;
          })
          .join("\n");

        // Discord has a limit of 1024 chars per field value. Truncate if needed.
        const truncatedList =
          meetingList.length > 1024
            ? meetingList.substring(0, 1021) + "..."
            : meetingList;
        embed.addFields({ name: "Upcoming Meetings", value: truncatedList });
      }

      return interaction.reply({ embeds: [embed] });
    } else if (subcommand === "cancel") {
      const id = interaction.options.getString("id");
      const removed = removeMeeting(id);

      if (removed) {
        return interaction.reply({
          content: `✅ Meeting with ID \`${id}\` has been cancelled.`,
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: `❌ No meeting found with ID \`${id}\`. Check \`/meetings list\`.`,
          ephemeral: true,
        });
      }
    }
  },
};
