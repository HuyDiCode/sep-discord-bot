const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Create a poll for users to vote on")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question to ask")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription(
          "Options separated by commas (e.g. Apple, Banana, Orange). Default: Yes, No"
        )
        .setRequired(false)
    ),
  async execute(interaction) {
    const question = interaction.options.getString("question");
    const optionsString = interaction.options.getString("options");

    let options = [];
    if (optionsString) {
      options = optionsString
        .split(",")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);
    } else {
      options = ["Yes", "No"];
    }

    if (options.length > 10) {
      return interaction.reply({
        content: "You can only have up to 10 options!",
        ephemeral: true,
      });
    }
    if (options.length < 2) {
      return interaction.reply({
        content: "You need at least 2 options!",
        ephemeral: true,
      });
    }

    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    // If default Yes/No, use check/cross
    let useDefaultEmojis = false;
    if (!optionsString) {
      useDefaultEmojis = true;
    }

    let description = "";
    options.forEach((opt, index) => {
      const emoji = useDefaultEmojis
        ? index === 0
          ? "✅"
          : "❌"
        : emojis[index];
      description += `${emoji} **${opt}**\n\n`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle(`📊 ${question}`)
      .setDescription(description)
      .setFooter({ text: `Poll created by ${interaction.user.username}` })
      .setTimestamp();

    const message = await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    });

    try {
      if (useDefaultEmojis) {
        await message.react("✅");
        await message.react("❌");
      } else {
        for (let i = 0; i < options.length; i++) {
          await message.react(emojis[i]);
        }
      }
    } catch (error) {
      console.error("One of the emojis failed to react:", error);
    }
  },
};
