import { google } from 'googleapis';

const CALENDAR_ID = 'swaminathann@xime.org';
const SLOT_START  = 9;   // 09:00 IST
const SLOT_END    = 15;  // 15:00 IST
const SLOT_MINS   = 30;

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key:   process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
}

// Returns array of { date, time, available } for next N weekdays
export async function getAvailableSlots(weeksAhead = 2) {
  const auth     = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  // Build date range — next 2 weeks of weekdays
  const now      = new Date();
  const timeMin  = new Date(now);
  const timeMax  = new Date(now);
  timeMax.setDate(timeMax.getDate() + weeksAhead * 7);

  // Get busy times
  let busyTimes = [];
  try {
    const resp = await calendar.freebusy.query({
      requestBody: {
        timeMin:  timeMin.toISOString(),
        timeMax:  timeMax.toISOString(),
        timeZone: 'Asia/Kolkata',
        items:    [{ id: CALENDAR_ID }],
      },
    });
    busyTimes = resp.data.calendars?.[CALENDAR_ID]?.busy || [];
  } catch (err) {
    console.error('[Calendar] freebusy error:', err.message);
    // Return all slots as available if calendar fails
    busyTimes = [];
  }

  // Generate all 30-min slots for weekdays in range
  const slots = [];
  const cursor = new Date(timeMin);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < timeMax) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) { // skip weekends
      for (let h = SLOT_START; h < SLOT_END; h++) {
        for (let m = 0; m < 60; m += SLOT_MINS) {
          const slotStart = new Date(cursor);
          slotStart.setHours(h, m, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_MINS);

          // Skip past slots
          if (slotStart <= now) continue;

          // Check if busy
          const busy = busyTimes.some((b) => {
            const bStart = new Date(b.start);
            const bEnd   = new Date(b.end);
            return slotStart < bEnd && slotEnd > bStart;
          });

          slots.push({
            date:      cursor.toISOString().split('T')[0],
            time:      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
            available: !busy,
          });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}
