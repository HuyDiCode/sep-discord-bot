const fs = require("node:fs");
const path = require("node:path");

const DATA_PATH = path.join(__dirname, "../../data/repos.json");

// Helper to read data
function readData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify({ repos: [] }, null, 2));
    }
    const data = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading repo data:", error);
    return { repos: [] };
  }
}

// Helper to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing repo data:", error);
  }
}

module.exports = {
  getRepos: () => {
    const data = readData();
    return data.repos || [];
  },
  addRepo: (owner, name, channelId) => {
    const data = readData();
    // Check if already exists
    const exists = data.repos.some((r) => r.owner === owner && r.name === name);
    if (exists) return false;

    data.repos.push({ owner, name, channelId, lastEventId: null });
    writeData(data);
    return true;
  },
  removeRepo: (owner, name) => {
    const data = readData();
    const initialLength = data.repos.length;
    data.repos = data.repos.filter(
      (r) => !(r.owner === owner && r.name === name)
    );

    if (data.repos.length !== initialLength) {
      writeData(data);
      return true;
    }
    return false;
  },
  updateRepoLastEventId: (owner, name, eventId) => {
    const data = readData();
    const repo = data.repos.find((r) => r.owner === owner && r.name === name);
    if (repo) {
      repo.lastEventId = eventId;
      writeData(data);
    }
  },
};
