'use client';

import React, { useState } from 'react';
import { ClipboardList, CalendarDays, ExternalLink, Check, X as XIcon } from 'lucide-react';
import { useRequestsStore } from '@/src/store/requests-store';
import { useTournamentsStore } from '@/src/store/tournaments-store';
import { TournamentRequest, Tournament, GAME_LABELS, REGION_LABELS } from '@/src/types';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';

const STATUS_LABELS: Record<TournamentRequest['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

const STATUS_STYLES: Record<TournamentRequest['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  approved: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
};

export function RequestsView() {
  const requests = useRequestsStore((state) => state.requests);
  const approveRequest = useRequestsStore((state) => state.approveRequest);
  const rejectRequest = useRequestsStore((state) => state.rejectRequest);
  const addTournament = useTournamentsStore((state) => state.addTournament);
  const [selectedRequest, setSelectedRequest] = useState<TournamentRequest | null>(null);

  const handleApprove = (request: TournamentRequest) => {
    const tournament: Tournament = {
      id: `t-${Date.now()}`,
      name: request.name,
      game: request.game,
      format: 'offline',
      region: request.region,
      country: REGION_LABELS[request.region],
      city: '—',
      startDate: request.startDate,
      endDate: request.endDate,
      status: 'upcoming',
      prizePool: '—',
      playersCount: 0,
      description: request.comment || 'Без описания',
      bannerUrl: request.bannerUrl,
      organizerName: '—',
      sourceUrl: request.url || undefined,
    };
    addTournament(tournament);
    approveRequest(request.id);
    setSelectedRequest(null);
    showToast(`Турнир «${request.name}» создан`, 'success');
  };

  const handleReject = (request: TournamentRequest) => {
    rejectRequest(request.id);
    setSelectedRequest(null);
    showToast(`Заявка «${request.name}» отклонена`, 'info');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Заявки</h1>

      {(requests?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Заявок пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r: TournamentRequest) => (
            <button
              key={r.id}
              onClick={() => setSelectedRequest(r)}
              className="w-full text-left bg-[#1A1A2E] rounded-xl border border-border/30 hover:border-border/60 transition-colors p-4 flex items-center gap-4"
            >
              {r.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.bannerUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate">{r.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{r.startDate} — {r.endDate}</span>
                  <span>{GAME_LABELS[r.game]}</span>
                  <span>{REGION_LABELS[r.region]}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title={selectedRequest?.name ?? ''}>
        {selectedRequest && (
          <div className="space-y-4">
            {selectedRequest.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedRequest.bannerUrl} alt="" className="w-full h-40 object-cover rounded-lg" />
            )}
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[selectedRequest.status]}`}>
              {STATUS_LABELS[selectedRequest.status]}
            </span>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" />{selectedRequest.startDate} — {selectedRequest.endDate}</div>
              <div>Дисциплина: <span className="text-foreground">{GAME_LABELS[selectedRequest.game]}</span></div>
              <div>Регион: <span className="text-foreground">{REGION_LABELS[selectedRequest.region]}</span></div>
              {selectedRequest.url && (
                <a href={selectedRequest.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#EF4444] hover:underline">
                  Ссылка на турнир <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {selectedRequest.comment && (
              <p className="text-sm text-muted-foreground">{selectedRequest.comment}</p>
            )}
            {selectedRequest.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Создать турнир
                </button>
                <button
                  onClick={() => handleReject(selectedRequest)}
                  className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <XIcon className="w-4 h-4" /> Отклонить
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
