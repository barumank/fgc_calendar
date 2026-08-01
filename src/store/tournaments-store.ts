import { create } from 'zustand';
import { Tournament } from '@/src/types';
import { mockTournaments } from '@/src/data/mock-tournaments';

interface TournamentsState {
  tournaments: Tournament[];
  addTournament: (tournament: Tournament) => void;
}

export const useTournamentsStore = create<TournamentsState>((set) => ({
  tournaments: mockTournaments,
  addTournament: (tournament) => set((state) => ({ tournaments: [...state.tournaments, tournament] })),
}));
