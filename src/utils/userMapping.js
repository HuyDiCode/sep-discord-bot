const fs = require("node:fs");
const path = require("node:path");

const DATA_PATH = path.join(__dirname, "../../data/users.json");

// Helper to read data
function readData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify({ users: {} }, null, 2));
    }
    const data = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading user data:", error);
    return { users: {} };
  }
}

// Helper to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing user data:", error);
  }
}

module.exports = {
  getJiraEmail: (discordId) => {
    const data = readData();
    return data.users[discordId]?.jiraEmail || null;
  },
  getGithubUsername: (discordId) => {
    const data = readData();
    return data.users[discordId]?.githubUsername || null;
  },
  setJiraEmail: (discordId, email) => {
    const data = readData();
    if (!data.users[discordId]) data.users[discordId] = {};
    data.users[discordId].jiraEmail = email;
    writeData(data);
  },
  setGithubUsername: (discordId, username) => {
    const data = readData();
    if (!data.users[discordId]) data.users[discordId] = {};
    data.users[discordId].githubUsername = username;
    writeData(data);
  },
};
