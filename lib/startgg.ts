const STARTGG_API_URL = 'https://api.start.gg/gql/alpha';

export function extractStartggTournamentSlug(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!/(^|\.)start\.gg$/i.test(parsed.hostname)) return null;
    const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const idx = segments.findIndex((s) => s.toLowerCase() === 'tournament');
    if (idx === -1 || !segments[idx + 1]) return null;
    return segments[idx + 1];
  } catch {
    return null;
  }
}

export interface StartggEvent {
  id: string;
  name: string;
  slug: string;
  startAt: number | null;
  isOnline: boolean;
  videogameId: string | null;
  videogameName: string | null;
}

export interface StartggTournament {
  name: string;
  city: string | null;
  countryCode: string | null;
  events: StartggEvent[];
}

const TOURNAMENT_EVENTS_QUERY = `
  query TournamentEvents($slug: String!) {
    tournament(slug: $slug) {
      name
      city
      countryCode
      events {
        id
        name
        slug
        startAt
        isOnline
        videogame {
          id
          name
        }
      }
    }
  }
`;

export async function fetchStartggTournamentEvents(slug: string, apiToken: string): Promise<StartggTournament> {
  const res = await fetch(STARTGG_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ query: TOURNAMENT_EVENTS_QUERY, variables: { slug } }),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('Превышен лимит запросов к start.gg API, попробуйте чуть позже');
    throw new Error(`start.gg API error: ${res.status}`);
  }

  const json = await res.json();
  if (json?.errors?.length) {
    const message = json.errors[0]?.message ?? 'unknown error';
    throw new Error(`start.gg API error: ${message}`);
  }

  const tournament = json?.data?.tournament;
  if (!tournament) {
    throw new Error('Турнир не найден на start.gg — проверьте ссылку');
  }

  return {
    name: tournament.name ?? '',
    city: tournament.city ?? null,
    countryCode: tournament.countryCode ?? null,
    events: (tournament.events ?? []).map((e: any) => ({
      id: String(e?.id ?? ''),
      name: e?.name ?? '',
      slug: e?.slug ?? '',
      startAt: typeof e?.startAt === 'number' ? e.startAt : null,
      isOnline: !!e?.isOnline,
      videogameId: e?.videogame?.id != null ? String(e.videogame.id) : null,
      videogameName: e?.videogame?.name ?? null,
    })),
  };
}

// Countries commonly grouped as "СНГ" and "Европа" in this app's region filter.
// Everything else falls back to "other" — safer than guessing wrong.
const CIS_COUNTRY_CODES = new Set(['AM', 'AZ', 'GE', 'KG', 'MD', 'TJ', 'TM', 'UZ']);
const EUROPE_COUNTRY_CODES = new Set([
  'GB', 'IE', 'FR', 'DE', 'ES', 'PT', 'IT', 'NL', 'BE', 'LU', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS',
  'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'HR', 'SI', 'RS', 'BA', 'ME', 'MK', 'AL', 'EE', 'LV', 'LT', 'MT', 'CY',
]);

export function regionFromCountryCode(countryCode: string | null): string {
  switch ((countryCode ?? '').toUpperCase()) {
    case 'RU': return 'russia';
    case 'BY': return 'belarus';
    case 'KZ': return 'kazakhstan';
    case 'US': return 'usa';
    case 'JP': return 'japan';
    case 'UA': return 'ukraine';
    default:
      if (CIS_COUNTRY_CODES.has((countryCode ?? '').toUpperCase())) return 'cis';
      if (EUROPE_COUNTRY_CODES.has((countryCode ?? '').toUpperCase())) return 'europe';
      return 'other';
  }
}

// Site convention: dates/times are stored as Moscow wall-clock strings (see
// lib/discord.ts). start.gg gives a true Unix timestamp, so convert it to
// Moscow local Y-M-D/H:M rather than assuming it's already Moscow time.
export function unixToMoscowDateTime(unixSeconds: number): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(unixSeconds * 1000));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}
