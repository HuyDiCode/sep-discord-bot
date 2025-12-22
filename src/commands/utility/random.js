const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  createList,
  getList,
  pickFromList,
  deleteList,
  getAllLists,
} = require("../../utils/randomManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Random generator utilities")
    .addSubcommand((subcommand) =>
      subcommand.setName("coin").setDescription("Flip a coin (Heads or Tails)")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("number")
        .setDescription("Get a random number between min and max")
        .addIntegerOption((option) =>
          option
            .setName("min")
            .setDescription("Minimum number")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("max")
            .setDescription("Maximum number")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pick")
        .setDescription("Pick a random item from a list (stateless)")
        .addStringOption((option) =>
          option
            .setName("items")
            .setDescription("Items separated by commas")
            .setRequired(true)
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("list")
        .setDescription("Manage persistent lists (pick and remove)")
        .addSubcommand((sub) =>
          sub
            .setName("create")
            .setDescription("Create a new list")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("List name").setRequired(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("items")
                .setDescription("Items separated by commas")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("pick")
            .setDescription("Pick and remove an item from a list")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("List name").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("view")
            .setDescription("View a list or all lists")
            .addStringOption((opt) =>
              opt
                .setName("name")
                .setDescription("List name (optional)")
                .setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("delete")
            .setDescription("Delete a list")
            .addStringOption((opt) =>
              opt.setName("name").setDescription("List name").setRequired(true)
            )
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    if (group === "list") {
      const name = interaction.options.getString("name");

      if (subcommand === "create") {
        const itemsString = interaction.options.getString("items");
        const items = itemsString
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        if (items.length === 0) {
          return interaction.reply({
            content: "List cannot be empty!",
            ephemeral: true,
          });
        }

        const success = createList(name, items, interaction.user.id);
        if (success) {
          return interaction.reply({
            content: `✅ List **${name}** created with ${items.length} items.`,
            ephemeral: true,
          });
        } else {
          return interaction.reply({
            content: `❌ List **${name}** already exists!`,
            ephemeral: true,
          });
        }
      } else if (subcommand === "pick") {
        const result = pickFromList(name);

        if (result.error === "not_found") {
          return interaction.reply({
            content: `❌ List **${name}** not found!`,
            ephemeral: true,
          });
        }
        if (result.error === "empty") {
          return interaction.reply({
            content: `⚠️ List **${name}** is empty!`,
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle(`🎲 Picked from ${name}`)
          .setDescription(`Result: **${result.item}**`)
          .setFooter({ text: `${result.remaining} items remaining` });

        return interaction.reply({ embeds: [embed] });
      } else if (subcommand === "view") {
        if (name) {
          const list = getList(name);
          if (!list) {
            return interaction.reply({
              content: `❌ List **${name}** not found!`,
              ephemeral: true,
            });
          }

          const itemsStr =
            list.items.length > 0 ? list.items.join("\n• ") : "(Empty)";
          const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(`📜 List: ${name}`)
            .setDescription(`**Items (${list.items.length}):**\n• ${itemsStr}`)
            .setFooter({ text: `Created by <@${list.createdBy}>` });

          return interaction.reply({ embeds: [embed] });
        } else {
          const allLists = getAllLists();
          const names = Object.keys(allLists);

          if (names.length === 0) {
            return interaction.reply({
              content: "No lists found.",
              ephemeral: true,
            });
          }

          const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle("📜 All Random Lists")
            .setDescription(
              names
                .map((n) => `• **${n}** (${allLists[n].items.length} items)`)
                .join("\n")
            );

          return interaction.reply({ embeds: [embed] });
        }
      } else if (subcommand === "delete") {
        const success = deleteList(name);
        if (success) {
          return interaction.reply({
            content: `✅ List **${name}** deleted.`,
            ephemeral: true,
          });
        } else {
          return interaction.reply({
            content: `❌ List **${name}** not found!`,
            ephemeral: true,
          });
        }
      }
      return;
    }

    if (subcommand === "coin") {
      const result = Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙";
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("Coin Flip")
        .setDescription(`The result is: **${result}**`);
      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "number") {
      const min = interaction.options.getInteger("min");
      const max = interaction.options.getInteger("max");

      if (min > max) {
        return interaction.reply({
          content: "Min cannot be greater than Max!",
          ephemeral: true,
        });
      }

      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Random Number")
        .setDescription(
          `Random number between ${min} and ${max}: **${result}**`
        );
      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "pick") {
      const itemsString = interaction.options.getString("items");
      const items = itemsString
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (items.length === 0) {
        return interaction.reply({
          content: "Please provide a valid list of items!",
          ephemeral: true,
        });
      }

      const picked = items[Math.floor(Math.random() * items.length)];
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("Random Pick")
        .setDescription(`I picked: **${picked}**`)
        .setFooter({ text: `From: ${items.join(", ")}` });
      await interaction.reply({ embeds: [embed] });
    }
  },
};
