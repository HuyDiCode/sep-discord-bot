const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../../data/randomLists.json");

// Ensure data directory exists
const dataDir = path.dirname(dataPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadLists() {
  if (!fs.existsSync(dataPath)) {
    return {};
  }
  try {
    const data = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading randomLists.json:", error);
    return {};
  }
}

function saveLists(lists) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(lists, null, 2));
  } catch (error) {
    console.error("Error writing randomLists.json:", error);
  }
}

module.exports = {
  createList: (name, items, createdBy) => {
    const lists = loadLists();
    if (lists[name]) return false; // Already exists

    lists[name] = {
      items: [...items],
      originalItems: [...items],
      createdBy,
      createdAt: new Date().toISOString(),
      originalCount: items.length,
    };
    saveLists(lists);
    return true;
  },

  resetList: (name) => {
    const lists = loadLists();
    const list = lists[name];
    if (!list) return false;

    // If originalItems exists, restore it. If not (legacy data), we can't fully reset unless we stored it.
    // For new lists, originalItems will be there.
    if (list.originalItems) {
      list.items = [...list.originalItems];
      saveLists(lists);
      return true;
    }
    return false;
  },

  getList: (name) => {
    const lists = loadLists();
    return lists[name];
  },

  pickFromList: (name) => {
    const lists = loadLists();
    const list = lists[name];

    if (!list) return { error: "not_found" };
    if (list.items.length === 0) return { error: "empty" };

    const index = Math.floor(Math.random() * list.items.length);
    const item = list.items[index];

    // Remove item
    list.items.splice(index, 1);
    saveLists(lists);

    return { item, remaining: list.items.length };
  },

  deleteList: (name) => {
    const lists = loadLists();
    if (!lists[name]) return false;
    delete lists[name];
    saveLists(lists);
    return true;
  },

  getAllLists: () => {
    return loadLists();
  },

  ensureDefaultList: (name, items, createdBy) => {
    const lists = loadLists();
    if (!lists[name]) {
      lists[name] = {
        items: [...items],
        originalItems: [...items],
        createdBy,
        createdAt: new Date().toISOString(),
        originalCount: items.length,
      };
      saveLists(lists);
      return true; // Created
    }
    return false; // Existed
  },
};
