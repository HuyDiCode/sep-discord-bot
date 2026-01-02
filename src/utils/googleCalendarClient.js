const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();

// Path to service account key file
// You can also use GOOGLE_APPLICATION_CREDENTIALS env var, but we'll handle it explicitly here for clarity
const KEY_FILE_PATH = path.join(__dirname, "../../google-credentials.json");

// Scopes required
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

async function getCalendarEvents(calendarId) {
  try {
    // Check if credentials exist
    // For production, we might want to load from ENV string if file doesn't exist
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Get events for the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: now.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error.message);
    return [];
  }
}

module.exports = { getCalendarEvents };
