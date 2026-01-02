const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../../data/meetings.json");

function loadMeetings() {
  if (!fs.existsSync(dataPath)) {
    return {
      daily: {
        enabled: false,
        time: "09:00",
        channelId: "",
        lastSent: "",
        lastReminded15: "",
      },
      upcoming: [],
    };
  }
  const data = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(data);
  // Ensure backward compatibility
  if (!parsed.daily.lastReminded15) parsed.daily.lastReminded15 = "";
  if (!parsed.googleCalendar) {
    parsed.googleCalendar = {
      remindedEvents: [], // List of event IDs that have been reminded
    };
  }
  return parsed;
}

function saveMeetings(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function setDailyMeeting(time, channelId) {
  const data = loadMeetings();
  data.daily = {
    enabled: true,
    time: time,
    channelId: channelId,
    lastSent: data.daily.lastSent || "",
    lastReminded15: data.daily.lastReminded15 || "",
  };
  saveMeetings(data);
  return data.daily;
}

function disableDailyMeeting() {
  const data = loadMeetings();
  data.daily.enabled = false;
  saveMeetings(data);
}

function addMeeting(title, timestamp, channelId, createdBy) {
  const data = loadMeetings();
  const meeting = {
    id: Date.now().toString(),
    title,
    timestamp,
    channelId,
    createdBy,
    reminded15: false,
  };
  data.upcoming.push(meeting);
  // Sort by timestamp
  data.upcoming.sort((a, b) => a.timestamp - b.timestamp);
  saveMeetings(data);
  return meeting;
}

function removeMeeting(id) {
  const data = loadMeetings();
  const initialLength = data.upcoming.length;
  data.upcoming = data.upcoming.filter((m) => m.id !== id);
  saveMeetings(data);
  return data.upcoming.length < initialLength;
}

function getMeetings() {
  return loadMeetings();
}

function updateDailyLastSent(dateStr) {
  const data = loadMeetings();
  data.daily.lastSent = dateStr;
  saveMeetings(data);
}

function updateDailyLastReminded15(dateStr) {
  const data = loadMeetings();
  data.daily.lastReminded15 = dateStr;
  saveMeetings(data);
}

function markMeetingReminded15(id) {
  const data = loadMeetings();
  const meeting = data.upcoming.find((m) => m.id === id);
  if (meeting) {
    meeting.reminded15 = true;
    saveMeetings(data);
  }
}

function markGoogleEventReminded(eventId) {
  const data = loadMeetings();
  if (!data.googleCalendar) {
    data.googleCalendar = { remindedEvents: [] };
  }
  if (!data.googleCalendar.remindedEvents.includes(eventId)) {
    data.googleCalendar.remindedEvents.push(eventId);
    // Keep array size manageable (e.g., last 100 events)
    if (data.googleCalendar.remindedEvents.length > 100) {
      data.googleCalendar.remindedEvents.shift();
    }
    saveMeetings(data);
  }
}

function isGoogleEventReminded(eventId) {
  const data = loadMeetings();
  if (!data.googleCalendar || !data.googleCalendar.remindedEvents) return false;
  return data.googleCalendar.remindedEvents.includes(eventId);
}

module.exports = {
  loadMeetings,
  saveMeetings,
  setDailyMeeting,
  disableDailyMeeting,
  addMeeting,
  removeMeeting,
  updateDailyLastSent,
  updateDailyLastReminded15,
  markMeetingReminded15,
  markGoogleEventReminded,
  isGoogleEventReminded,
};
