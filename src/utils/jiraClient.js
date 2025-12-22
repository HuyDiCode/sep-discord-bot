const { Version3Client } = require("jira.js");
require("dotenv").config();

const jira = new Version3Client({
  host: process.env.JIRA_DOMAIN,
  authentication: {
    basic: {
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    },
  },
});

module.exports = jira;
