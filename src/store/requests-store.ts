import { create } from 'zustand';
import { TournamentRequest } from '@/src/types';

interface RequestsState {
  requests: TournamentRequest[];
  addRequest: (request: TournamentRequest) => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
}

export const useRequestsStore = create<RequestsState>((set) => ({
  requests: [],
  addRequest: (request) => set((state) => ({ requests: [request, ...state.requests] })),
  approveRequest: (id) => set((state) => ({
    requests: state.requests.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)),
  })),
  rejectRequest: (id) => set((state) => ({
    requests: state.requests.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)),
  })),
}));
