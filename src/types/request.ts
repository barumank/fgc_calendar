import { GameType, RegionType, FormatType } from './tournament';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface TournamentRequest {
  id: string;
  name: string;
  url: string;
  comment: string;
  startDate: string;
  endDate: string;
  region: RegionType;
  game: GameType;
  format: FormatType;
  bannerUrl?: string;
  status: RequestStatus;
  createdAt: string;
}
