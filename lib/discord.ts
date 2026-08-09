// No per-tournament timezone is tracked anywhere in this app — dates/times are
// entered by Russian organizers, so we assume Moscow time (UTC+3) when building
// the ISO timestamps Discord's API requires.
const ASSUMED_TIMEZONE_OFFSET = '+03:00';

export interface DiscordEventTournament {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  format: string;
  city: string;
  country: string;
  sourceUrl: string | null;
  bannerUrl: string | null;
}

export function getScheduledStart(startDate: string, startTime: string | null): Date {
  return new Date(`${startDate}T${startTime || '00:00'}:00${ASSUMED_TIMEZONE_OFFSET}`);
}

export async function createDiscordScheduledEvent(guildId: string, botToken: string, t: DiscordEventTournament): Promise<string> {
  const startTime = t.startTime || '00:00';
  const scheduledStartTime = `${t.startDate}T${startTime}:00${ASSUMED_TIMEZONE_OFFSET}`;
  const scheduledEndTime = `${t.endDate}T23:59:00${ASSUMED_TIMEZONE_OFFSET}`;

  const location = (t.format === 'online' ? 'Online' : `${t.city}, ${t.country}`).slice(0, 100);
  const description = [t.description, t.sourceUrl].filter(Boolean).join('\n\n').slice(0, 1000);

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/scheduled-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({
      name: t.name.slice(0, 100),
      description,
      scheduled_start_time: scheduledStartTime,
      scheduled_end_time: scheduledEndTime,
      privacy_level: 2, // GUILD_ONLY
      entity_type: 3, // EXTERNAL
      entity_metadata: { location },
      ...(t.bannerUrl ? { image: t.bannerUrl } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Discord API error: ${res.status}${body ? ` — ${body.slice(0, 300)}` : ''}`);
  }

  const data = await res.json();
  return data.id;
}
