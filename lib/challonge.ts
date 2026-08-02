export const CHALLONGE_MONTHLY_LIMIT = 500;

export function extractChallongeSlug(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('https://challonge.com/')) return null;
  try {
    const parsed = new URL(url);
    const slug = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
    return slug || null;
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

  const res = await fetch(`https://api.challonge.com/v2.1/tournaments/${slug}/participants.json`, {
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/json',
      'Authorization-Type': 'v1',
      Authorization: apiKey,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Challonge API error: ${res.status}`);
  }

  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  return data.map((p: any) => ({
    id: String(p?.id ?? ''),
    name: p?.attributes?.name ?? 'Unknown',
    username: p?.attributes?.username ?? null,
    finalRank: p?.attributes?.final_rank ?? null,
  }));
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
