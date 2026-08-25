import { GameType, RegionType, FormatType } from './tournament';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface TournamentRequest {
  id: string;
  name: string;
  url: string;
  communicationUrl?: string;
  comment: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  region: RegionType;
  city?: string;
  game: GameType;
  format: FormatType;
  bannerUrl?: string;
  status: RequestStatus;
  createdAt: string;
}
