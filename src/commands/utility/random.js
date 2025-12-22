const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  createList,
  getList,
  pickFromList,
  deleteList,
  getAllLists,
  resetList,
  ensureDefaultList,
} = require("../../utils/randomManager");

const TEAM_MEMBERS = ["Huy", "Nguyên", "Trí", "Đào", "Hoàng"];
const TEAM_LIST_NAME = "team_members";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Random generator utilities")
    .addSubcommand((subcommand) =>
      subcommand.setName("coin").setDescription("Flip a coin (Heads or Tails)")
    )
    .addSubcommandGroup((group) =>
      group
        .setName("member")
        .setDescription(
          "Pick from the team list (Huy, Nguyên, Trí, Đào, Hoàng)"
        )
        .addSubcommand((sub) =>
          sub
            .setName("pick")
            .setDescription("Pick a member and remove from list")
        )
        .addSubcommand((sub) =>
          sub.setName("reset").setDescription("Reset the team list to full")
        )
        .addSubcommand((sub) =>
          sub.setName("view").setDescription("View remaining members")
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("list")
        .setDescription("Manage custom lists")
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
            .setName("reset")
            .setDescription("Reset a list to original items")
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

    // --- COIN ---
    if (subcommand === "coin") {
      const result = Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙";
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("Coin Flip")
        .setDescription(`The result is: **${result}**`);
      return interaction.reply({ embeds: [embed] });
    }

    // --- MEMBER (Predefined List) ---
    if (group === "member") {
      // Ensure list exists
      ensureDefaultList(TEAM_LIST_NAME, TEAM_MEMBERS, "SYSTEM");

      if (subcommand === "pick") {
        const result = pickFromList(TEAM_LIST_NAME);

        if (result.error === "empty") {
          return interaction.reply({
            content: `⚠️ Team list is empty! Use \`/random member reset\` to start over.`,
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle(`🎲 Picked Member`)
          .setDescription(`Result: **${result.item}**`)
          .setFooter({ text: `${result.remaining} members remaining` });

        return interaction.reply({ embeds: [embed] });
      } else if (subcommand === "reset") {
        resetList(TEAM_LIST_NAME);
        return interaction.reply({
          content: `✅ Team list has been reset to: ${TEAM_MEMBERS.join(", ")}`,
        });
      } else if (subcommand === "view") {
        const list = getList(TEAM_LIST_NAME);
        const itemsStr =
          list.items.length > 0 ? list.items.join("\n• ") : "(Empty)";
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(`📜 Team Members`)
          .setDescription(
            `**Remaining (${list.items.length}):**\n• ${itemsStr}`
          );
        return interaction.reply({ embeds: [embed] });
      }
    }

    // --- LIST (Custom Lists) ---
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
            content: `⚠️ List **${name}** is empty! Use \`/random list reset name:${name}\` to restart.`,
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle(`🎲 Picked from ${name}`)
          .setDescription(`Result: **${result.item}**`)
          .setFooter({ text: `${result.remaining} items remaining` });

        return interaction.reply({ embeds: [embed] });
      } else if (subcommand === "reset") {
        const success = resetList(name);
        if (success) {
          return interaction.reply({
            content: `✅ List **${name}** has been reset.`,
          });
        } else {
          return interaction.reply({
            content: `❌ List **${name}** not found or cannot be reset.`,
            ephemeral: true,
          });
        }
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
    }
  },
};
