const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const jira = require("../../utils/jiraClient");
const { getJiraEmail } = require("../../utils/userMapping");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mytasks")
    .setDescription("List your assigned Jira tasks"),
  async execute(interaction) {
    const discordId = interaction.user.id;
    const jiraEmail = getJiraEmail(discordId);

    if (!jiraEmail) {
      return interaction.reply({
        content:
          "❌ Your Discord account is not linked to a Jira email. Please use the `/linkjira` command to link your account.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Step 1: Find Jira Account ID from Email
      const users = await jira.userSearch.findUsers({ query: jiraEmail });

      if (users.length === 0) {
        return interaction.editReply(
          `❌ Could not find any Jira user with email: **${jiraEmail}**`
        );
      }

      const accountId = users[0].accountId;

      // Step 2: JQL using Account ID
      const jql = `assignee = "${accountId}" AND statusCategory != Done ORDER BY priority DESC`;

      // Use enhanced search endpoint to avoid 410 Gone error
      const searchResults =
        await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
          jql: jql,
          maxResults: 10,
          fields: ["summary", "status", "priority"],
        });

      if (searchResults.issues.length === 0) {
        return interaction.editReply(
          "🎉 You have no active tasks assigned to you!"
        );
      }

      const embed = new EmbedBuilder()
        .setColor(0x0052cc)
        .setTitle(`Tasks for ${interaction.user.username}`)
        .setDescription(
          `Found ${searchResults.issues.length} active tasks assigned to **${jiraEmail}**`
        )
        .setTimestamp();

      searchResults.issues.forEach((issue) => {
        const key = issue.key;
        const summary = issue.fields.summary;
        const status = issue.fields.status.name;
        const priority = issue.fields.priority
          ? issue.fields.priority.name
          : "None";
        const link = `${process.env.JIRA_DOMAIN}/browse/${key}`;

        embed.addFields({
          name: `${key} (${status})`,
          value: `[${summary}](${link})\nPriority: ${priority}`,
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "⚠️ Failed to fetch tasks from Jira. Please check the bot logs."
      );
    }
  },
};
