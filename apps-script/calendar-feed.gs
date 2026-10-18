// Mine Clock calendar feed.
//
// Returns the next 24 hours of events from this account's calendar as JSON, for the clock to poll.
// Deploy one copy per Google account (it reads the calendar of the account it runs as):
//   1. script.google.com → New project → paste this file.
//   2. Run `doGet` once from the editor and allow the calendar permission.
//   3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
//   4. Copy the Web app URL (ends in /exec).
// Optional: Project Settings → Script properties → CALENDAR_IDS = comma-separated calendar ids
// to read besides the default calendar (e.g. a work calendar shared to this account).

const HOURS_AHEAD = 24;
const DEFAULT_REMINDER_MIN = 10;

function doGet() {
    const now = Date.now();
    const since = new Date(now - 60 * 60 * 1000);
    const until = new Date(now + HOURS_AHEAD * 60 * 60 * 1000);
    const extraIds = (PropertiesService.getScriptProperties().getProperty('CALENDAR_IDS') || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    const calendars = [CalendarApp.getDefaultCalendar(), ...extraIds.map((id) => CalendarApp.getCalendarById(id)).filter(Boolean)];

    const events = calendars
        .flatMap((calendar) => calendar.getEvents(since, until))
        .filter((event) => !event.isAllDayEvent())
        .filter((event) => event.getMyStatus() !== CalendarApp.GuestStatus.NO)
        .map((event) => {
            const reminders = event.getPopupReminders();
            return {
                id: event.getId(),
                title: event.getTitle() || '(no title)',
                start: event.getStartTime().getTime(),
                end: event.getEndTime().getTime(),
                reminders: reminders.length ? reminders : [DEFAULT_REMINDER_MIN],
            };
        });

    return ContentService.createTextOutput(JSON.stringify({ events })).setMimeType(ContentService.MimeType.JSON);
}
