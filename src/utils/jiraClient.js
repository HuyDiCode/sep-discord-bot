const { Version3Client } = require("jira.js");
require("dotenv").config();

let jira;

if (
  process.env.JIRA_DOMAIN &&
  process.env.JIRA_EMAIL &&
  process.env.JIRA_API_TOKEN
) {
  jira = new Version3Client({
    host: process.env.JIRA_DOMAIN,
    authentication: {
      basic: {
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
      },
    },
  });
} else {
  console.warn("⚠️ Jira credentials missing. Jira client not initialized.");
  // Create a dummy proxy to prevent crashes if commands import it but don't use it immediately
  jira = new Proxy(
    {},
    {
      get: function (target, prop) {
        return () => {
          throw new Error(
            "Jira client is not initialized due to missing credentials."
          );
        };
      },
    }
  );
}

module.exports = jira;
