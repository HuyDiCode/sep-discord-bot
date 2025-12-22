const { EmbedBuilder } = require("discord.js");
const {
  loadMeetings,
  removeMeeting,
  updateDailyLastSent,
  updateDailyLastReminded15,
  markMeetingReminded15,
} = require("./meetingManager");

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
  }, 30000); // Run every 30 seconds

  console.log("📅 Meeting Scheduler started.");
}

module.exports = { startMeetingScheduler };
