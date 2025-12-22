const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  setDailyMeeting,
  disableDailyMeeting,
} = require("../../utils/meetingManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Manage daily meeting reminders")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set the daily meeting time")
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription("Time in HH:MM format (24h)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("off")
        .setDescription("Disable daily meeting reminders")
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "set") {
      const time = interaction.options.getString("time");
      // Validate time format HH:MM
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return interaction.reply({
          content:
            "❌ Invalid time format. Please use HH:MM (e.g., 09:00 or 14:30).",
          ephemeral: true,
        });
      }

      setDailyMeeting(time, interaction.channelId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Daily Meeting Set")
        .setDescription(
          `Daily meeting reminder set for **${time}** in this channel.`
        )
        .setFooter({ text: "Bot will ping @everyone at this time." });

      return interaction.reply({ embeds: [embed] });
    } else if (subcommand === "off") {
      disableDailyMeeting();
      return interaction.reply({
        content: "🔕 Daily meeting reminders have been disabled.",
        ephemeral: true,
      });
    }
  },
};
