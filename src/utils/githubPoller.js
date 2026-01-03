const { Octokit } = require("octokit");
const { getRepos, updateRepoLastEventId } = require("./repoManager");
require("dotenv").config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const POLL_INTERVAL = 60 * 1000; // 1 minute

async function pollGitHubEvents(client) {
  console.log("🔄 Starting GitHub Polling Service...");

  setInterval(async () => {
    const repos = getRepos();
    if (repos.length === 0) return;

    for (const repo of repos) {
      try {
        const { data: events } = await octokit.request(
          "GET /repos/{owner}/{repo}/events",
          {
            owner: repo.owner,
            repo: repo.name,
            per_page: 5, // Only get latest 5 events
          }
        );

        if (events.length === 0) continue;

        // If first run for this repo, just set the last ID
        if (!repo.lastEventId) {
          updateRepoLastEventId(repo.owner, repo.name, events[0].id);
          console.log(`✅ Initialized polling for ${repo.owner}/${repo.name}`);
          continue;
        }

        // Filter new events
        const newEvents = [];
        for (const event of events) {
          if (event.id === repo.lastEventId) break;
          newEvents.push(event);
        }

        if (newEvents.length > 0) {
          // Update lastEventId
          updateRepoLastEventId(repo.owner, repo.name, newEvents[0].id);

          // Process events
          const channel = await client.channels.fetch(repo.channelId);
          if (!channel) {
            console.error(
              `❌ Channel ${repo.channelId} not found for ${repo.owner}/${repo.name}`
            );
            continue;
          }

          for (const event of newEvents.reverse()) {
            let message = null;

            switch (event.type) {
              case "PushEvent":
                const commitCount =
                  event.payload.size || event.payload.commits?.length || 1;
                const branch = event.payload.ref.replace("refs/heads/", "");
                message = `🔨 **${event.actor.login}** pushed ${commitCount} commit(s) to \`${repo.name}:${branch}\``;
                break;
              case "PullRequestEvent":
                const action = event.payload.action;
                const pr = event.payload.pull_request;
                message = `🔀 **${event.actor.login}** ${action} Pull Request in \`${repo.name}\`: [${pr.title}](${pr.html_url})`;
                break;
              case "IssuesEvent":
                const issueAction = event.payload.action;
                const issue = event.payload.issue;
                message = `🐛 **${event.actor.login}** ${issueAction} Issue in \`${repo.name}\`: [${issue.title}](${issue.html_url})`;
                break;
            }

            if (message) {
              await channel.send(message);
            }
          }
        }
      } catch (error) {
        console.error(
          `⚠️ Error polling ${repo.owner}/${repo.name}:`,
          error.message
        );
      }
    }
  }, POLL_INTERVAL);
}

module.exports = { pollGitHubEvents };
