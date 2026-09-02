export interface GameRecord {
  id?: string;
  key: string;
  label: string;
  shortLabel?: string | null;
  color: string;
  order: number;
  startggVideogameId?: string | null;
}

export const DEFAULT_GAMES: GameRecord[] = [
  { key: 'tekken8', label: 'Tekken 8', shortLabel: 'Tek8', color: '#7C3AED', order: 0 },
  { key: 'sf6', label: 'Street Fighter 6', shortLabel: 'SF6', color: '#2563EB', order: 1 },
  { key: 'guilty_gear', label: 'Guilty Gear Strive', shortLabel: 'GGST', color: '#16A34A', order: 2 },
  { key: 'avatar_legends', label: 'Avatar Legends', shortLabel: 'AvaLeg', color: '#0EA5E9', order: 3 },
  { key: '2xko', label: '2XKO', shortLabel: '2XKO', color: '#DB2777', order: 4 },
  { key: 'kof15', label: 'KoF 15', shortLabel: 'KoF15', color: '#CA8A04', order: 5 },
  { key: 'fatal_fury', label: 'Fatal Fury', shortLabel: 'FatalF', color: '#0D9488', order: 6 },
  { key: 'marvel_tokon', label: 'Marvel Tokon', shortLabel: 'MTFS', color: '#D97706', order: 7 },
  { key: 'multi_game', label: 'Multi-Game', shortLabel: 'Multy', color: '#DC2626', order: 8 },
  { key: 'other', label: 'Другое', shortLabel: 'Другое', color: '#EA580C', order: 9 },
];
