export interface League {
  id: string;
  name: string;
  game: string;
  startDate: string;
  endDate: string;
  registrationUrl: string | null;
  discordUrl: string | null;
}

export type LeagueStatus = 'upcoming' | 'active' | 'ended';

export const DAY_MS = 24 * 60 * 60 * 1000;

export function dayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function leagueStatus(league: Pick<League, 'startDate' | 'endDate'>, today: string): LeagueStatus {
  if (league.endDate < today) return 'ended';
  if (league.startDate > today) return 'upcoming';
  return 'active';
}

// Overlapping leagues of one discipline go on separate lanes; a league takes
// the first lane that's already free by its start date, so sequential
// leagues share a lane instead of making the row taller than needed.
export function assignLanes<T extends Pick<League, 'startDate' | 'endDate'>>(leagues: T[]): { league: T; lane: number }[] {
  const sorted = [...leagues].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate));
  const laneEnds: string[] = [];
  return sorted.map((league) => {
    let lane = laneEnds.findIndex((end) => end < league.startDate);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(league.endDate);
    } else {
      laneEnds[lane] = league.endDate;
    }
    return { league, lane };
  });
}

// Only http(s) links are accepted, so a stored value can never be a
// javascript: or data: URL once it's rendered as a link.
export function normalizeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}
