import { GameType, RegionType } from './tournament';

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
  bannerUrl?: string;
  status: RequestStatus;
  createdAt: string;
}
