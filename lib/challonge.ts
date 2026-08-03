export const CHALLONGE_MONTHLY_LIMIT = 500;

export function extractChallongeSlug(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('https://challonge.com/')) return null;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (segments.length === 0) return null;
    // Challonge sometimes prefixes URLs with a locale, e.g. /ru/TournamentSlug
    if (segments.length >= 2 && /^[a-z]{2}(-[a-z]{2})?$/i.test(segments[0])) {
      return segments[1];
    }
    return segments[0];
  } catch {
    return null;
  }
}

export interface ChallongeParticipant {
  id: string;
  name: string;
  username: string | null;
  finalRank: number | null;
}

export async function fetchChallongeParticipants(slug: string): Promise<ChallongeParticipant[]> {
  const apiKey = process.env.CHALLONGE_API_KEY;
  if (!apiKey) throw new Error('CHALLONGE_API_KEY is not configured');

  // Uses the v1 endpoint (not v2.1): v1 permits GET on any tournament,
  // including ones not owned by this API key's account; v2.1 is account-scoped
  // and 404s on third-party tournaments even with a v1-key-compat auth header.
  const url = `https://api.challonge.com/v1/tournaments/${encodeURIComponent(slug)}/participants.json?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Challonge API error: ${res.status}${body ? ` — ${body.slice(0, 300)}` : ''}`);
  }

  const json = await res.json();
  const data = Array.isArray(json) ? json : [];
  return data.map((entry: any) => {
    const p = entry?.participant ?? {};
    return {
      id: String(p?.id ?? ''),
      name: p?.name ?? 'Unknown',
      username: p?.challonge_username ?? p?.username ?? null,
      finalRank: p?.final_rank ?? null,
    };
  });
}

export function pointsForRank(rank: number): number {
  if (rank === 1) return 16;
  if (rank === 2) return 12;
  if (rank === 3) return 8;
  if (rank === 4) return 6;
  if (rank <= 8) return 4;
  return 0;
}

export function currentUsageMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
