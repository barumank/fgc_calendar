'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { ClipboardList, CalendarDays, ExternalLink, Check, X as XIcon, Trophy, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { TournamentRequest, REGION_LABELS, FORMAT_LABELS, GameType } from '@/src/types';
import { useGames } from '@/src/hooks/use-games';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { extractChallongeSlug } from '@/lib/challonge';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

const ALL_STATUSES: TournamentRequest['status'][] = ['pending', 'approved', 'rejected'];
const PAGE_SIZE = 20;

export function RequestsView() {
  const { gameKeys: ALL_GAMES, labels: GAME_LABELS } = useGames();
  const { data: requests, mutate, isLoading } = useSWR<TournamentRequest[]>('/next-api/requests', fetcher);
  const { data: usage, mutate: mutateUsage } = useSWR<{ count: number; limit: number }>('/next-api/challonge-usage', fetcher);
  const [selectedRequest, setSelectedRequest] = useState<TournamentRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [fetchingResult, setFetchingResult] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TournamentRequest['status'] | ''>('');
  const [filterGame, setFilterGame] = useState<GameType | ''>('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return (requests ?? []).filter((r: TournamentRequest) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterGame && r.game !== filterGame) return false;
      if (filterDate && r.startDate !== filterDate) return false;
      return true;
    });
  }, [requests, filterStatus, filterGame, filterDate]);

  useEffect(() => { setPage(1); }, [filterStatus, filterGame, filterDate]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const handleAction = async (request: TournamentRequest, action: 'approve' | 'reject' | 'unapprove') => {
    setProcessing(true);
    try {
      const res = await fetch(`/next-api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Action failed');
      await mutate();
      setSelectedRequest(null);
      const messages = {
        approve: [`Турнир «${request.name}» создан`, 'success'] as const,
        reject: [`Заявка «${request.name}» отклонена`, 'info'] as const,
        unapprove: [`Одобрение заявки «${request.name}» отменено, турнир удалён`, 'info'] as const,
      };
      const [message, type] = messages[action];
      showToast(message, type);
    } catch {
      showToast('Не удалось обработать заявку', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleResultClick = async (request: TournamentRequest) => {
    if (fetchingResult) return;
    setFetchingResult(true);
    try {
      const res = await fetch(`/next-api/requests/${request.id}/challonge-result`, { method: 'POST' });
      const data = await res.json();
      await mutateUsage();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось получить результаты', 'error');
        return;
      }
      if (!data.tournamentFinished) {
        showToast('Турнир на Challonge ещё не завершён — итоговых мест пока нет', 'info');
        return;
      }
      showToast(`Обновлено: ${data.playersCount} участников, топ-8 сохранён в «Игроки»`, 'success');
    } catch {
      showToast('Не удалось получить результаты', 'error');
    } finally {
      setFetchingResult(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Заявки</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterStatus} onChange={(e: any) => setFilterStatus(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="" className="bg-[#1A1A2E] text-foreground">Все статусы</option>
          {ALL_STATUSES.map((s: TournamentRequest['status']) => <option key={s} value={s} className="bg-[#1A1A2E] text-foreground">{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filterGame} onChange={(e: any) => setFilterGame(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="" className="bg-[#1A1A2E] text-foreground">Все игры</option>
          {ALL_GAMES.map((g: GameType) => <option key={g} value={g} className="bg-[#1A1A2E] text-foreground">{GAME_LABELS[g]}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e: any) => setFilterDate(e?.target?.value ?? '')}
          className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">Загрузка...</div>
      ) : (filtered?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{(requests?.length ?? 0) === 0 ? 'Заявок пока нет' : 'Ничего не найдено по выбранным фильтрам'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(paginated ?? []).map((r: TournamentRequest) => (
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
                  <span>{FORMAT_LABELS[r.format]}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">Страница {page} из {totalPages}</span>
          <button
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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
              <div>Тип турнира: <span className="text-foreground">{FORMAT_LABELS[selectedRequest.format]}</span></div>
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
                  onClick={() => handleAction(selectedRequest, 'approve')}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Создать турнир
                </button>
                <button
                  onClick={() => handleAction(selectedRequest, 'reject')}
                  disabled={processing}
                  className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <XIcon className="w-4 h-4" /> Отклонить
                </button>
              </div>
            )}
            {selectedRequest.status === 'approved' && (
              <div className="pt-2 space-y-2">
                {usage && (
                  <p className="text-xs text-muted-foreground text-right">
                    Запросов к Challonge в этом месяце: {usage.count}/{usage.limit}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(selectedRequest, 'unapprove')}
                    disabled={processing}
                    className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Отменить
                  </button>
                  <button
                    onClick={() => handleResultClick(selectedRequest)}
                    disabled={fetchingResult || !extractChallongeSlug(selectedRequest.url)}
                    title={!extractChallongeSlug(selectedRequest.url) ? 'Ссылка на турнир не похожа на Challonge (https://challonge.com/...)' : undefined}
                    className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4" /> {fetchingResult ? 'Получаем...' : 'Результат'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
