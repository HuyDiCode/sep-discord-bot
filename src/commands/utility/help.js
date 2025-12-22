const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all available commands"),
  async execute(interaction) {
    const commands = interaction.client.commands;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("🤖 Bot Help - Available Commands")
      .setDescription("Here are the commands you can use:")
      .setTimestamp();

    // Categorize commands manually for better display
    const categories = {
      "Jira 🔷": ["mytasks", "linkjira"],
      "GitHub 🐙": ["addrepo", "removerepo", "listrepos", "linkgithub"],
      "Meetings 📅": ["daily", "schedule", "meetings"],
      "Utility 🛠️": ["help", "ping", "vote", "random"],
    };

    const processedCommands = new Set();

    for (const [category, commandNames] of Object.entries(categories)) {
      const fieldValues = [];
      for (const name of commandNames) {
        const cmd = commands.get(name);
        if (cmd) {
          fieldValues.push(`**/${cmd.data.name}**: ${cmd.data.description}`);
          processedCommands.add(name);
        }
      }
      if (fieldValues.length > 0) {
        embed.addFields({ name: category, value: fieldValues.join("\n") });
      }
    }

    // Add any remaining commands that weren't categorized
    const otherCommands = [];
    commands.forEach((cmd) => {
      if (!processedCommands.has(cmd.data.name)) {
        otherCommands.push(`**/${cmd.data.name}**: ${cmd.data.description}`);
      }
    });

    if (otherCommands.length > 0) {
      embed.addFields({ name: "Other 📌", value: otherCommands.join("\n") });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
