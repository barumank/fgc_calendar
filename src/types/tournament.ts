// Disciplines are managed dynamically in the admin panel (see src/hooks/use-games.ts)
// rather than hardcoded here — this type is intentionally just a string.
export type GameType = string;
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
  createdAt?: string;
}

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
