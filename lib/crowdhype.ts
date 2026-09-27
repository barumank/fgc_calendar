const CROWDHYPE_API_URL = 'https://crowdhype.pro/api/v1';

async function getCrowdhype(path: string): Promise<any> {
  const res = await fetch(`${CROWDHYPE_API_URL}${path}`, { cache: 'no-store' });

  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 429) throw new Error('Превышен лимит запросов к crowdhype.pro, попробуйте чуть позже');
    throw new Error(`crowdhype.pro API error: ${res.status}`);
  }

  return res.json();
}

export function extractCrowdhypeEventId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!/(^|\.)crowdhype\.pro$/i.test(parsed.hostname)) return null;
    const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const idx = segments.findIndex((s) => s.toLowerCase() === 'events');
    if (idx === -1 || !segments[idx + 1]) return null;
    return segments[idx + 1];
  } catch {
    return null;
  }
}

// A crowdhype "tournament" is one discipline's bracket inside an event —
// this is what gets stored as Tournament.sourceUrl per imported FDE
// tournament, and is what result-collection parses back out.
export function extractCrowdhypeTournamentId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!/(^|\.)crowdhype\.pro$/i.test(parsed.hostname)) return null;
    const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const idx = segments.findIndex((s) => s.toLowerCase() === 'tournaments');
    if (idx === -1 || !segments[idx + 1]) return null;
    return segments[idx + 1];
  } catch {
    return null;
  }
}

export interface CrowdhypeEvent {
  id: string;
  title: string;
  isOnline: boolean;
  location: string | null;
}

export async function fetchCrowdhypeEvent(eventId: string): Promise<CrowdhypeEvent> {
  const data = await getCrowdhype(`/events/${encodeURIComponent(eventId)}`);
  if (!data) throw new Error('Мероприятие не найдено на crowdhype.pro — проверьте ссылку');
  return {
    id: data.id,
    title: data.title ?? '',
    isOnline: !!data.isOnline,
    location: data.location ?? null,
  };
}

export interface CrowdhypeTournament {
  id: string;
  title: string;
  format: string;
  status: string;
  participantsCount: number;
  startDate: string | null;
  endDate: string | null;
  gameId: string | null;
  gameName: string | null;
}

function mapCrowdhypeTournament(t: any): CrowdhypeTournament {
  return {
    id: String(t?.id ?? ''),
    title: t?.title ?? '',
    format: t?.format ?? '',
    status: t?.status ?? '',
    participantsCount: typeof t?.participantsCount === 'number' ? t.participantsCount : 0,
    startDate: t?.startDate ?? null,
    endDate: t?.endDate ?? null,
    gameId: t?.game?.id != null ? String(t.game.id) : null,
    gameName: t?.game?.name ?? null,
  };
}

export async function fetchCrowdhypeEventTournaments(eventId: string): Promise<CrowdhypeTournament[]> {
  const data = await getCrowdhype(`/events/${encodeURIComponent(eventId)}/tournaments`);
  const list = Array.isArray(data) ? data : [];
  return list.map(mapCrowdhypeTournament);
}

export async function fetchCrowdhypeTournament(tournamentId: string): Promise<CrowdhypeTournament | null> {
  const data = await getCrowdhype(`/tournaments/${encodeURIComponent(tournamentId)}`);
  return data ? mapCrowdhypeTournament(data) : null;
}

// Only FDE (Full Double Elimination) brackets have a shape we can reliably
// turn into placements — Swiss/RR standings would need this platform's own
// ranking algorithm (Buchholz etc.), which isn't exposed as data.
export const CROWDHYPE_COLLECTIBLE_FORMAT = 'FDE';

// Site convention: dates/times are stored as Moscow wall-clock strings (see
// lib/discord.ts / lib/startgg.ts). crowdhype gives true UTC ISO timestamps.
export function isoToMoscowDateTime(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

interface BracketParticipant {
  id: string;
  userId: string | null;
  displayName: string;
}

interface BracketParticipantRef {
  id: string;
  userId?: string | null;
  user?: { id?: string | null; displayName?: string | null };
}

interface BracketMatch {
  round: number;
  status: string;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  participant1?: BracketParticipantRef | null;
  participant2?: BracketParticipantRef | null;
}

interface Bracket {
  config: { bracketType: string };
  matches: BracketMatch[];
}

interface BracketResponse {
  brackets: Bracket[];
}

export interface CrowdhypeStanding {
  rank: number;
  name: string;
  crowdhypePlayerId: string | null;
}

export async function fetchCrowdhypeBracket(tournamentId: string): Promise<BracketResponse> {
  const data = await getCrowdhype(`/tournaments/${encodeURIComponent(tournamentId)}/bracket`);
  if (!data) throw new Error('Сетка турнира не найдена на crowdhype.pro');
  return data;
}

// Derives top-8 placements from a Full Double Elimination bracket:
// 1st/2nd come from the grand final's decisive match (the bracket-reset
// match if it was played, otherwise the first grand final match); 3rd is
// the loser of the losers bracket's last round; 4th and beyond are the
// losers of each preceding losers-bracket round, working backwards, with
// tied finishers (matches in the same round) sharing a rank number.
export function computeFdeStandings(bracket: BracketResponse): CrowdhypeStanding[] {
  const participants = new Map<string, BracketParticipant>();
  const registerParticipant = (p: BracketParticipantRef | null | undefined) => {
    if (!p?.id) return;
    participants.set(p.id, {
      id: p.id,
      userId: p.userId ?? p.user?.id ?? null,
      displayName: p.user?.displayName ?? 'Unknown',
    });
  };
  for (const b of bracket.brackets ?? []) {
    for (const m of b.matches ?? []) {
      registerParticipant(m.participant1);
      registerParticipant(m.participant2);
    }
  }

  const resolve = (participantId: string | null, rank: number): CrowdhypeStanding | null => {
    if (!participantId) return null;
    const p = participants.get(participantId);
    return { rank, name: p?.displayName ?? 'Unknown', crowdhypePlayerId: p?.userId ?? null };
  };

  const opponentOf = (m: BracketMatch): string | null =>
    m.winnerId === m.participant1Id ? m.participant2Id : m.participant1Id;

  const grandFinal = bracket.brackets?.find((b) => b.config?.bracketType === 'grand_final');
  const losers = bracket.brackets?.find((b) => b.config?.bracketType === 'losers');
  if (!grandFinal) return [];

  const gfRound1 = grandFinal.matches.find((m) => m.round === 1);
  const gfRound2 = grandFinal.matches.find((m) => m.round === 2);
  if (!gfRound1 || gfRound1.status !== 'completed' || !gfRound1.winnerId) return [];

  const decisive = gfRound2?.status === 'completed' && gfRound2.winnerId ? gfRound2 : gfRound1;
  const results: CrowdhypeStanding[] = [];
  const first = resolve(decisive.winnerId, 1);
  const second = resolve(opponentOf(decisive), 2);
  if (first) results.push(first);
  if (second) results.push(second);

  if (losers) {
    const roundsDesc = [...new Set(losers.matches.map((m) => m.round))].sort((a, b) => b - a);
    let rank = 3;
    for (const round of roundsDesc) {
      if (results.length >= 8) break;
      const roundLosers = losers.matches
        .filter((m) => m.round === round && m.status === 'completed' && m.winnerId)
        .map((m) => resolve(opponentOf(m), rank))
        .filter((r): r is CrowdhypeStanding => !!r);
      if (roundLosers.length === 0) continue;
      for (const r of roundLosers) {
        if (results.length >= 8) break;
        results.push(r);
      }
      rank += roundLosers.length;
    }
  }

  return results.slice(0, 8);
}
