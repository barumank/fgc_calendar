export interface GameRecord {
  id?: string;
  key: string;
  label: string;
  color: string;
  order: number;
}

export const DEFAULT_GAMES: GameRecord[] = [
  { key: 'tekken8', label: 'Tekken 8', color: '#7C3AED', order: 0 },
  { key: 'sf6', label: 'Street Fighter 6', color: '#2563EB', order: 1 },
  { key: 'guilty_gear', label: 'Guilty Gear Strive', color: '#16A34A', order: 2 },
  { key: 'avatar_legends', label: 'Avatar Legends', color: '#0EA5E9', order: 3 },
  { key: '2xko', label: '2XKO', color: '#DB2777', order: 4 },
  { key: 'kof15', label: 'KoF 15', color: '#CA8A04', order: 5 },
  { key: 'fatal_fury', label: 'Fatal Fury', color: '#0D9488', order: 6 },
  { key: 'marvel_tokon', label: 'Marvel Tokon', color: '#D97706', order: 7 },
  { key: 'multi_game', label: 'Multi-Game', color: '#DC2626', order: 8 },
  { key: 'other', label: 'Другое', color: '#EA580C', order: 9 },
];
