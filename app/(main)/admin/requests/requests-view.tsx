'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { ClipboardList, CalendarDays, Clock, ExternalLink, Check, X as XIcon, Trophy, RotateCcw, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import { TournamentRequest, REGION_LABELS, FORMAT_LABELS, GameType } from '@/src/types';
import { useGames } from '@/src/hooks/use-games';
import { Modal } from '@/src/components/common/modal';
import { LinkifiedText } from '@/src/components/common/linkified-text';
import { showToast } from '@/src/components/common/toast-notification';
import { extractChallongeSlug } from '@/lib/challonge';
import { extractStartggTournamentSlug, extractStartggEventSlug } from '@/lib/startgg';
import { HeaderActions } from '@/src/components/layout/header-actions';

interface StartggPreviewEvent {
  id: string;
  name: string;
  videogameName: string | null;
  videogameId: string | null;
  isOnline: boolean;
  startDate: string | null;
  startTime: string | null;
  mappedGameKey: string | null;
  mappedGameLabel: string | null;
}

interface RequestTournament {
  id: string;
  name: string;
  sourceUrl: string | null;
  playersCount: number;
  resultsFetchedAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function TournamentResultRow({ tournament, onUpdated, onChallongeUsage }: {
  tournament: RequestTournament;
  onUpdated: (playersCount: number, resultsFetchedAt: string) => void;
  onChallongeUsage: () => void;
}) {
  const [fetching, setFetching] = useState(false);
  const challongeSlug = extractChallongeSlug(tournament.sourceUrl);
  const startggSlug = extractStartggEventSlug(tournament.sourceUrl);
  const endpoint = challongeSlug
    ? `/next-api/tournaments/${tournament.id}/challonge-result`
    : startggSlug
      ? `/next-api/tournaments/${tournament.id}/startgg-result`
      : null;

  const handleClick = async (force: boolean) => {
    if (!endpoint || fetching) return;
    if (force && !window.confirm(`Пересобрать результаты для «${tournament.name}»? Прошлые начисления очков игрокам будут отменены и заменены новыми.`)) return;
    setFetching(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (challongeSlug) onChallongeUsage();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось получить результаты', 'error');
        return;
      }
      if (!data.tournamentFinished) {
        showToast(`«${tournament.name}»: турнир ещё не завершён — итоговых мест пока нет`, 'info');
        return;
      }
      onUpdated(data.playersCount, new Date().toISOString());
      showToast(`«${tournament.name}»: обновлено — ${data.playersCount} участников, топ-8 сохранён в «Игроки»`, 'success');
    } catch {
      showToast('Не удалось получить результаты', 'error');
    } finally {
      setFetching(false);
    }
  };

  const collected = !!tournament.resultsFetchedAt;

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{tournament.name}</div>
        <div className="text-xs text-muted-foreground">
          {tournament.playersCount} игроков
          {collected && <span className="text-green-400"> · собрано {formatDateTime(tournament.resultsFetchedAt as string)}</span>}
        </div>
      </div>
      {collected ? (
        <button
          onClick={() => handleClick(true)}
          disabled={fetching || !endpoint}
          title={!endpoint ? 'Источник ссылки не поддерживает автосбор результатов' : undefined}
          className="shrink-0 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" /> {fetching ? 'Пересобираем...' : 'Пересобрать'}
        </button>
      ) : (
        <button
          onClick={() => handleClick(false)}
          disabled={fetching || !endpoint}
          title={!endpoint ? 'Источник ссылки не поддерживает автосбор результатов' : undefined}
          className="shrink-0 bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
        >
          <Trophy className="w-4 h-4" /> {fetching ? 'Получаем...' : 'Результат'}
        </button>
      )}
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
  const { data: requestTournaments, mutate: mutateRequestTournaments } = useSWR<RequestTournament[]>(
    selectedRequest?.status === 'approved' ? `/next-api/requests/${selectedRequest.id}/tournaments` : null,
    fetcher,
  );
  const [filterStatus, setFilterStatus] = useState<TournamentRequest['status'] | ''>('pending');
  const [filterGame, setFilterGame] = useState<GameType | ''>('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const [startggEvents, setStartggEvents] = useState<StartggPreviewEvent[] | null>(null);
  const [startggLoading, setStartggLoading] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

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
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('Action failed');
      // Update the list from the PATCH response immediately instead of
      // waiting on a second full GET round-trip — that extra wait was
      // making every approve/reject/unapprove feel sluggish.
      mutate(
        (current) => (current ?? []).map((r) => (r.id === data.request.id ? data.request : r)),
        { revalidate: false },
      );
      closeRequestModal();
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


  const closeRequestModal = () => {
    setSelectedRequest(null);
    setStartggEvents(null);
    setSelectedEventIds(new Set());
  };

  const openRequest = (r: TournamentRequest) => {
    setSelectedRequest(r);
    setStartggEvents(null);
    setSelectedEventIds(new Set());
  };

  const handleStartggPreview = async (request: TournamentRequest) => {
    if (startggLoading) return;
    setStartggLoading(true);
    try {
      const res = await fetch(`/next-api/requests/${request.id}/startgg-preview`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось получить события со start.gg', 'error');
        return;
      }
      setStartggEvents(data.events ?? []);
      setSelectedEventIds(new Set((data.events ?? []).filter((e: StartggPreviewEvent) => e.mappedGameKey).map((e: StartggPreviewEvent) => e.id)));
    } catch {
      showToast('Не удалось получить события со start.gg', 'error');
    } finally {
      setStartggLoading(false);
    }
  };

  const toggleStartggEvent = (id: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartggImport = async (request: TournamentRequest) => {
    if (importing || selectedEventIds.size === 0) return;
    setImporting(true);
    try {
      const res = await fetch(`/next-api/requests/${request.id}/startgg-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: [...selectedEventIds] }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось импортировать турниры', 'error');
        return;
      }
      mutate(
        (current) => (current ?? []).map((r) => (r.id === data.request.id ? data.request : r)),
        { revalidate: false },
      );
      closeRequestModal();
      showToast(`Создано турниров: ${data.createdCount}`, 'success');
    } catch {
      showToast('Не удалось импортировать турниры', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="px-6 pt-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
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
        <div className="ml-auto"><HeaderActions /></div>
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
              onClick={() => openRequest(r)}
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
                  {r.startTime && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.startTime}</span>}
                  <span>{GAME_LABELS[r.game]}</span>
                  <span>{REGION_LABELS[r.region]}</span>
                  <span>{FORMAT_LABELS[r.format]}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0 text-right">{formatDateTime(r.createdAt)}</div>
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

      <Modal isOpen={!!selectedRequest} onClose={closeRequestModal} title={selectedRequest?.name ?? ''}>
        {selectedRequest && (
          <div className="space-y-4">
            {selectedRequest.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedRequest.bannerUrl} alt="" className="w-full h-40 object-cover rounded-lg" />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[selectedRequest.status]}`}>
                {STATUS_LABELS[selectedRequest.status]}
              </span>
              <span className="text-xs text-muted-foreground">Заявка создана: {formatDateTime(selectedRequest.createdAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" />{selectedRequest.startDate} — {selectedRequest.endDate}</div>
              {selectedRequest.startTime && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />{selectedRequest.startTime}</div>}
              <div>Дисциплина: <span className="text-foreground">{GAME_LABELS[selectedRequest.game]}</span></div>
              <div>Регион: <span className="text-foreground">{REGION_LABELS[selectedRequest.region]}</span></div>
              <div>Тип турнира: <span className="text-foreground">{FORMAT_LABELS[selectedRequest.format]}</span></div>
              {selectedRequest.url && (
                <a href={selectedRequest.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#EF4444] hover:underline">
                  Ссылка на турнир <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {selectedRequest.communicationUrl && (
                <a href={selectedRequest.communicationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#EF4444] hover:underline">
                  Общение по турниру <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {selectedRequest.comment && (
              <LinkifiedText text={selectedRequest.comment} className="text-sm text-muted-foreground" />
            )}
            {selectedRequest.status === 'pending' && startggEvents && (
              <div className="pt-2 space-y-3">
                <div className="text-xs text-muted-foreground">
                  Найдено событий на start.gg: {startggEvents.length}. Отметьте, какие турниры создать — событиям без сопоставленной дисциплины нужно сначала задать «ID игры на start.gg» в разделе «Дисциплины».
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {startggEvents.map((e) => (
                    <label
                      key={e.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg bg-white/5 ${!e.mappedGameKey ? 'opacity-50' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEventIds.has(e.id)}
                        disabled={!e.mappedGameKey}
                        onChange={() => toggleStartggEvent(e.id)}
                        className="rounded border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{e.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{e.videogameName ?? 'Игра не указана'}{e.videogameId ? <span className="font-mono"> (ID: {e.videogameId})</span> : ''}</span>
                          {e.mappedGameLabel ? (
                            <span className="text-green-400">→ {e.mappedGameLabel}</span>
                          ) : (
                            <span className="text-red-400">нет сопоставления дисциплины</span>
                          )}
                          {e.startDate && <span>{e.startDate}{e.startTime ? `, ${e.startTime}` : ''}</span>}
                          <span>{e.isOnline ? 'Онлайн' : 'Офлайн'}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStartggEvents(null)}
                    disabled={importing}
                    className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => handleStartggImport(selectedRequest)}
                    disabled={importing || selectedEventIds.size === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> {importing ? 'Создаём...' : `Создать турниры (${selectedEventIds.size})`}
                  </button>
                </div>
              </div>
            )}
            {selectedRequest.status === 'pending' && !startggEvents && (
              <div className="flex gap-3 pt-2">
                {extractStartggTournamentSlug(selectedRequest.url) ? (
                  <button
                    onClick={() => handleStartggPreview(selectedRequest)}
                    disabled={startggLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Gamepad2 className="w-4 h-4" /> {startggLoading ? 'Загружаем события...' : 'Импортировать со start.gg'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(selectedRequest, 'approve')}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Создать турнир
                  </button>
                )}
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
              <div className="pt-2 space-y-3">
                {usage && (
                  <p className="text-xs text-muted-foreground text-right">
                    Запросов к Challonge в этом месяце: {usage.count}/{usage.limit}
                  </p>
                )}
                <div className="space-y-2">
                  {!requestTournaments ? (
                    <div className="text-sm text-muted-foreground py-2">Загрузка турниров...</div>
                  ) : requestTournaments.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">Турниры не найдены</div>
                  ) : (
                    requestTournaments.map((t) => (
                      <TournamentResultRow
                        key={t.id}
                        tournament={t}
                        onChallongeUsage={() => mutateUsage()}
                        onUpdated={(playersCount, resultsFetchedAt) =>
                          mutateRequestTournaments(
                            (current) => (current ?? []).map((c) => (c.id === t.id ? { ...c, playersCount, resultsFetchedAt } : c)),
                            { revalidate: false },
                          )
                        }
                      />
                    ))
                  )}
                </div>
                <button
                  onClick={() => handleAction(selectedRequest, 'unapprove')}
                  disabled={processing}
                  className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Отменить
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
