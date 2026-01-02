const { EmbedBuilder } = require("discord.js");
const {
  loadMeetings,
  removeMeeting,
  updateDailyLastSent,
  updateDailyLastReminded15,
  markMeetingReminded15,
  isGoogleEventReminded,
  markGoogleEventReminded,
} = require("./meetingManager");
const { getCalendarEvents } = require("./googleCalendarClient");

function startMeetingScheduler(client) {
  // Check every minute
  setInterval(async () => {
    const now = new Date();
    const meetings = loadMeetings();

    // 1. Handle Daily Meeting
    if (meetings.daily.enabled && meetings.daily.channelId) {
      const [hour, minute] = meetings.daily.time.split(":").map(Number);

      // Create Date object for today's meeting
      const meetingTime = new Date(now);
      meetingTime.setHours(hour, minute, 0, 0);

      // 15-minute warning time
      const warningTime = new Date(meetingTime.getTime() - 15 * 60000);

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toDateString();

      // Check for 15-minute warning
      if (
        currentHour === warningTime.getHours() &&
        currentMinute === warningTime.getMinutes() &&
        meetings.daily.lastReminded15 !== todayStr
      ) {
        try {
          const channel = await client.channels.fetch(meetings.daily.channelId);
          if (channel) {
            const embed = new EmbedBuilder()
              .setColor(0xffff00)
              .setTitle("⏳ Daily Meeting Reminder")
              .setDescription(`Daily meeting starts in **15 minutes**!`)
              .setTimestamp();

            await channel.send({ content: "@everyone", embeds: [embed] });
            updateDailyLastReminded15(todayStr);
            console.log(`Sent daily meeting 15m warning to ${channel.name}`);
          }
        } catch (error) {
          console.error("Failed to send daily meeting warning:", error);
        }
      }

      // Check if it's time and we haven't sent it today yet
      if (
        currentHour === hour &&
        currentMinute === minute &&
        meetings.daily.lastSent !== todayStr
      ) {
        try {
          const channel = await client.channels.fetch(meetings.daily.channelId);
          if (channel) {
            const embed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle("📢 Daily Meeting Reminder")
              .setDescription(`It's time for the daily meeting! @everyone`)
              .setTimestamp();

            await channel.send({ content: "@everyone", embeds: [embed] });
            updateDailyLastSent(todayStr);
            console.log(`Sent daily meeting reminder to ${channel.name}`);
          }
        } catch (error) {
          console.error("Failed to send daily meeting reminder:", error);
        }
      }
    }

    // 2. Handle One-off Meetings
    // Check for 15-minute warnings
    const upcomingWarnings = meetings.upcoming.filter((m) => {
      const timeDiff = m.timestamp - now.getTime();
      return timeDiff <= 15 * 60000 && timeDiff > 0 && !m.reminded15;
    });

    for (const meeting of upcomingWarnings) {
      try {
        const channel = await client.channels.fetch(meeting.channelId);
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(0xffff00)
            .setTitle("⏳ Upcoming Meeting Reminder")
            .setDescription(`**${meeting.title}** starts in **15 minutes**!`)
            .addFields({
              name: "Scheduled By",
              value: `<@${meeting.createdBy}>`,
            })
            .setTimestamp();

          await channel.send({ content: "@everyone", embeds: [embed] });
          markMeetingReminded15(meeting.id);
          console.log(`Sent 15m warning for meeting: ${meeting.title}`);
        }
      } catch (error) {
        console.error(
          `Failed to send warning for meeting ${meeting.id}:`,
          error
        );
      }
    }

    // Check for starting meetings
    const dueMeetings = meetings.upcoming.filter(
      (m) => m.timestamp <= now.getTime()
    );

    for (const meeting of dueMeetings) {
      try {
        const channel = await client.channels.fetch(meeting.channelId);
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle("📅 Meeting Reminder")
            .setDescription(`**${meeting.title}** is starting now!`)
            .addFields({
              name: "Scheduled By",
              value: `<@${meeting.createdBy}>`,
            })
            .setTimestamp();

          await channel.send({ content: "@everyone", embeds: [embed] });
          console.log(`Sent reminder for meeting: ${meeting.title}`);
        }
      } catch (error) {
        console.error(
          `Failed to send reminder for meeting ${meeting.id}:`,
          error
        );
      }
      // Remove the meeting after notifying
      removeMeeting(meeting.id);
    }

    // 3. Handle Google Calendar Events
    if (process.env.GOOGLE_CALENDAR_ID && meetings.daily.channelId) {
      // Use the daily meeting channel for calendar notifications by default
      // Or we could add a specific config for this
      const events = await getCalendarEvents(process.env.GOOGLE_CALENDAR_ID);

      for (const event of events) {
        const start = event.start.dateTime || event.start.date;
        if (!start) continue;

        const startTime = new Date(start).getTime();
        const timeDiff = startTime - now.getTime();

        // Notify if within 15 minutes (and not passed)
        if (timeDiff <= 15 * 60000 && timeDiff > 0) {
          if (!isGoogleEventReminded(event.id)) {
            try {
              const channel = await client.channels.fetch(
                meetings.daily.channelId
              );
              if (channel) {
                const embed = new EmbedBuilder()
                  .setColor(0x3498db) // Blue for Google Calendar
                  .setTitle("📅 Google Calendar Reminder")
                  .setDescription(
                    `**${event.summary}** starts in **15 minutes**!`
                  )
                  .addFields(
                    {
                      name: "Time",
                      value: new Date(start).toLocaleTimeString("vi-VN"),
                      inline: true,
                    },
                    {
                      name: "Link",
                      value: event.htmlLink || "N/A",
                      inline: true,
                    }
                  )
                  .setTimestamp();

                await channel.send({ content: "@everyone", embeds: [embed] });
                markGoogleEventReminded(event.id);
                console.log(
                  `Sent Google Calendar reminder for ${event.summary}`
                );
              }
            } catch (error) {
              console.error("Failed to send Google Calendar reminder:", error);
            }
          }
        }
      }
    }
  }, 60000); // Check every minute

  console.log("📅 Meeting Scheduler started.");
}

module.exports = { startMeetingScheduler };
