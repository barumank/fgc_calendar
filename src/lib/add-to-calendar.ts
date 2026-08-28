// No per-tournament timezone is tracked anywhere in this app — dates/times are
// entered by Russian organizers, so we assume Moscow time (UTC+3), matching
// the same convention used for Discord export (see lib/discord.ts).
const ASSUMED_TIMEZONE_OFFSET = '+03:00';
const EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

export interface CalendarEventTournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  startTime?: string | null;
  format: string;
  city?: string | null;
  regionLabel: string;
  sourceUrl?: string | null;
}

function getEventRange(t: CalendarEventTournament) {
  const start = new Date(`${t.startDate}T${t.startTime || '00:00'}:00${ASSUMED_TIMEZONE_OFFSET}`);
  const end = new Date(start.getTime() + EVENT_DURATION_MS);
  return { start, end };
}

function toUtcBasic(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function getLocation(t: CalendarEventTournament): string {
  return t.format === 'online' ? 'Online' : [t.city, t.regionLabel].filter(Boolean).join(', ');
}

function getDetails(t: CalendarEventTournament): string {
  return [t.description, t.sourceUrl].filter(Boolean).join('\n\n');
}

export function buildGoogleCalendarUrl(t: CalendarEventTournament): string {
  const { start, end } = getEventRange(t);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: t.name,
    dates: `${toUtcBasic(start)}/${toUtcBasic(end)}`,
    details: getDetails(t),
    location: getLocation(t),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/[;,]/g, (m) => `\\${m}`).replace(/\r?\n/g, '\\n');
}

// Yandex Calendar has no documented public "pre-fill an event" URL anymore
// (its old ?e_name=...&start-date-day=... scheme is from the 2010-era UI).
// A standard .ics file is the reliable cross-calendar way to hand off an
// event — Yandex Calendar imports it, and so does everything else.
export function buildTournamentIcs(t: CalendarEventTournament): string {
  const { start, end } = getEventRange(t);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FightNexus//Tournament Calendar//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${t.id}@fgc-calendar.ru`,
    `DTSTAMP:${toUtcBasic(new Date())}`,
    `DTSTART:${toUtcBasic(start)}`,
    `DTEND:${toUtcBasic(end)}`,
    `SUMMARY:${escapeIcsText(t.name)}`,
    `DESCRIPTION:${escapeIcsText(getDetails(t))}`,
    `LOCATION:${escapeIcsText(getLocation(t))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}
