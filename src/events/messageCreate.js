const { Events } = require("discord.js");
const jira = require("../utils/jiraClient");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Regex to find Jira ticket keys (e.g., PROJ-123)
    const jiraTicketRegex = /([A-Z]+-\d+)/g;
    const matches = message.content.match(jiraTicketRegex);

    if (matches) {
      // Remove duplicates
      const uniqueTickets = [...new Set(matches)];

      for (const ticket of uniqueTickets) {
        try {
          const issue = await jira.issues.getIssue({ issueIdOrKey: ticket });

          const summary = issue.fields.summary;
          const status = issue.fields.status.name;
          const assignee = issue.fields.assignee
            ? issue.fields.assignee.displayName
            : "Unassigned";
          const priority = issue.fields.priority
            ? issue.fields.priority.name
            : "None";
          const link = `${process.env.JIRA_DOMAIN}/browse/${ticket}`;

          const replyContent =
            `🔍 **${ticket}**: [${summary}](${link})\n` +
            `> **Status**: ${status} | **Assignee**: ${assignee} | **Priority**: ${priority}`;

          await message.reply(replyContent);
        } catch (error) {
          console.error(
            `Failed to fetch Jira ticket ${ticket}:`,
            error.message
          );
        }
      }
    }
  },
};
