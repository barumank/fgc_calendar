export type GameType = 'tekken8' | 'sf6' | 'guilty_gear' | 'marvel_tokon' | 'avatar_legends' | 'multi_game' | 'other';
export type FormatType = 'online' | 'offline';
export type RegionType = 'russia' | 'belarus' | 'kazakhstan' | 'usa' | 'japan' | 'ukraine' | 'cis' | 'europe' | 'other';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  game: GameType;
  format: FormatType;
  region: RegionType;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  prizePool: string;
  playersCount: number;
  description: string;
  bannerUrl?: string;
  organizerName: string;
  sourceUrl?: string;
  bracketUrl?: string;
  featured?: boolean;
}

export const GAME_LABELS: Record<GameType, string> = {
  tekken8: 'Tekken 8',
  sf6: 'Street Fighter 6',
  guilty_gear: 'Guilty Gear Strive',
  marvel_tokon: 'Marvel Tokon',
  avatar_legends: 'Avatar Legends',
  multi_game: 'Multi-Game',
  other: 'Другое',
};

export const GAME_COLORS: Record<GameType, string> = {
  tekken8: '#7C3AED',
  sf6: '#2563EB',
  multi_game: '#DC2626',
  guilty_gear: '#16A34A',
  marvel_tokon: '#D97706',
  avatar_legends: '#0EA5E9',
  other: '#EA580C',
};

export const FORMAT_LABELS: Record<FormatType, string> = {
  online: 'Онлайн',
  offline: 'Офлайн',
};

export const REGION_LABELS: Record<RegionType, string> = {
  russia: 'Россия',
  belarus: 'Беларусь',
  kazakhstan: 'Казахстан',
  usa: 'США',
  japan: 'Япония',
  ukraine: 'Украина',
  cis: 'СНГ',
  europe: 'Европа',
  other: 'Другое',
};

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  upcoming: 'Предстоящий',
  ongoing: 'Идёт',
  completed: 'Завершён',
};
