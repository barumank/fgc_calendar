import { GameType, RegionType } from './tournament';

export interface Player {
  id: string;
  tag: string;
  realName: string;
  country: string;
  region: RegionType;
  mainGame: GameType;
  avatarUrl?: string;
  tournamentsPlayed: number;
  wins: number;
  top3: number;
  points: number;
  socialLinks: { discord?: string; twitter?: string; twitch?: string };
}
