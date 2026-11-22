'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle } from 'lucide-react';
import { useGames } from '@/src/hooks/use-games';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DuplicatePlayer {
  id: string;
  tag: string;
  tournamentsPlayed: number;
  wins: number;
  top3: number;
  points: number;
  challongeUsername: string | null;
  startggPlayerId: string | null;
  crowdhypePlayerId: string | null;
}

interface SearchPlayer extends DuplicatePlayer {
  mainGame: string;
}

interface DuplicateGroup {
  key: string;
  game: string;
  tag: string;
  players: DuplicatePlayer[];
  conflict: string | null;
}

function accountsOf(p: DuplicatePlayer): string {
  return [
    p.challongeUsername && `Challonge: ${p.challongeUsername}`,
    p.startggPlayerId && `start.gg: ${p.startggPlayerId}`,
    p.crowdhypePlayerId && `crowdhype: ${p.crowdhypePlayerId}`,
  ].filter(Boolean).join(' · ') || 'без привязки к платформе';
}

function ManualMerge({ gameLabels, onMerged }: { gameLabels: Record<string, string>; onMerged: () => void }) {
  const [queries, setQueries] = useState(['', '']);
  const [results, setResults] = useState<SearchPlayer[][]>([[], []]);
  const [selected, setSelected] = useState<(SearchPlayer | null)[]>([null, null]);
  const [loading, setLoading] = useState([false, false]);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    const controllers: AbortController[] = [];
    const timers = queries.map((query, index) => {
      if (selected[index] || query.trim().length < 2) return undefined;
      return setTimeout(async () => {
        const controller = new AbortController();
        controllers.push(controller);
        try {
          const response = await fetch(`/next-api/admin/players/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
          const data = await response.json();
          setResults((current) => current.map((items, i) => i === index ? (response.ok && Array.isArray(data) ? data : []) : items));
        } catch {
          if (!controller.signal.aborted) setResults((current) => current.map((items, i) => i === index ? [] : items));
        } finally {
          if (!controller.signal.aborted) setLoading((current) => current.map((value, i) => i === index ? false : value));
        }
      }, 250);
    });

    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
      controllers.forEach((controller) => controller.abort());
    };
  }, [queries, selected]);

  const choose = (index: number, player: SearchPlayer) => {
    setSelected((current) => current.map((item, i) => i === index ? player : item));
    setQueries((current) => current.map((query, i) => i === index ? '' : query));
    setResults((current) => current.map((items, i) => i === index ? [] : items));
    setLoading((current) => current.map((value, i) => i === index ? false : value));
  };

  const clear = (index: number) => {
    setSelected((current) => current.map((item, i) => i === index ? null : item));
    setQueries((current) => current.map((query, i) => i === index ? '' : query));
    setResults((current) => current.map((items, i) => i === index ? [] : items));
    setLoading((current) => current.map((value, i) => i === index ? false : value));
  };

  const sameGame = !!selected[0] && !!selected[1] && selected[0].mainGame === selected[1].mainGame;
  const conflict = selected[0] && selected[1] ? findManualConflict([selected[0], selected[1]]) : null;

  const merge = async () => {
    if (!selected[0] || !selected[1] || selected[0].id === selected[1].id || !sameGame || conflict || merging) return;
    const first = selected[0];
    const second = selected[1];
    if (!window.confirm(`Объединить карточку «${second.tag}» с основной карточкой «${first.tag}»? Очки и результаты сложатся, действие нельзя отменить.`)) return;

    setMerging(true);
    try {
      const response = await fetch('/next-api/admin/players/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId: first.id, otherIds: [second.id] }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data?.error ?? 'Не удалось объединить карточки', 'error');
        return;
      }
      showToast(`Карточка «${second.tag}» объединена с «${first.tag}»`, 'success');
      setSelected([null, null]);
      setQueries(['', '']);
      onMerged();
    } catch {
      showToast('Не удалось объединить карточки', 'error');
    } finally {
      setMerging(false);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-border/30 bg-[#1A1A2E] p-5">
      <h2 className="font-semibold mb-1">Ручное объединение</h2>
      <p className="text-xs text-muted-foreground mb-4">Найдите две карточки игрока. Первая останется основной, вторая будет объединена с ней.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="relative">
            <label className="block text-xs text-muted-foreground mb-1.5">{index === 0 ? 'Основная карточка' : 'Карточка для объединения'}</label>
            {selected[index] ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-[#242438] px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{selected[index]!.tag}</div>
                  <div className="text-xs text-muted-foreground">{gameLabels[selected[index]!.mainGame] ?? selected[index]!.mainGame} · {selected[index]!.points} очков · турниров {selected[index]!.tournamentsPlayed}</div>
                </div>
                <button type="button" onClick={() => clear(index)} className="text-xs text-muted-foreground hover:text-white">Изменить</button>
              </div>
            ) : (
              <>
                <input
                  value={queries[index]}
                  onChange={(event) => {
                    const value = event.target.value;
                    setQueries((current) => current.map((query, i) => i === index ? value : query));
                    setResults((current) => current.map((items, i) => i === index ? [] : items));
                    setLoading((current) => current.map((pending, i) => i === index ? value.trim().length >= 2 : pending));
                  }}
                  placeholder="Введите ник игрока..."
                  className="w-full rounded-lg bg-[#242438] border border-border/30 px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/60"
                />
                {loading[index] && <div className="mt-1 text-xs text-muted-foreground">Поиск...</div>}
                {results[index].length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border/40 bg-[#202035] shadow-xl">
                    {results[index].map((player) => (
                      <button type="button" key={player.id} onClick={() => choose(index, player)} className="block w-full border-b border-border/20 px-3 py-2 text-left last:border-0 hover:bg-white/[0.06]">
                        <span className="block text-sm font-medium">{player.tag}</span>
                        <span className="block text-xs text-muted-foreground">{gameLabels[player.mainGame] ?? player.mainGame} · {player.points} очков · турниров {player.tournamentsPlayed}</span>
                      </button>
                    ))}
                  </div>
                )}
                {queries[index].trim().length >= 2 && !loading[index] && results[index].length === 0 && <div className="mt-1 text-xs text-muted-foreground">Карточек с таким ником не найдено</div>}
              </>
            )}
          </div>
        ))}
      </div>
      {selected[0] && selected[1] && (
        <div className={`mt-3 text-xs ${!sameGame || conflict ? 'text-yellow-500' : 'text-muted-foreground'}`}>
          {selected[0].id === selected[1].id ? 'Выбрана одна и та же карточка.'
            : !sameGame ? 'У этих карточек нет общей дисциплины — объединить их нельзя.'
              : conflict ? `${conflict}: эти карточки объединять нельзя.`
                : `Общие дисциплины: ${gameLabels[selected[0].mainGame] ?? selected[0].mainGame}.`}
        </div>
      )}
      <button type="button" onClick={merge} disabled={!sameGame || !!conflict || selected[0]?.id === selected[1]?.id || merging} className="mt-4 rounded-lg bg-[#EF4444] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-40">
        {merging ? 'Объединение...' : 'Объединить карточки'}
      </button>
    </section>
  );
}

function findManualConflict(players: SearchPlayer[]): string | null {
  const accounts = [
    ['challongeUsername', 'Challonge'],
    ['startggPlayerId', 'start.gg'],
    ['crowdhypePlayerId', 'crowdhype'],
  ] as const;
  for (const [field, label] of accounts) {
    const values = new Set(players.map((player) => player[field]).filter(Boolean));
    if (values.size > 1) return `Разные аккаунты ${label}`;
  }
  return null;
}

function GroupCard({ group, gameLabel, onMerged }: { group: DuplicateGroup; gameLabel: string; onMerged: () => void }) {
  // The card with the most points is the natural survivor.
  const [primaryId, setPrimaryId] = useState(group.players[0].id);
  const [merging, setMerging] = useState(false);

  const total = group.players.reduce((sum, p) => sum + p.points, 0);

  const merge = async () => {
    if (merging) return;
    if (!window.confirm(`Объединить ${group.players.length} карточки «${group.tag}» в одну? Очки сложатся (${total}), действие нельзя отменить.`)) return;
    setMerging(true);
    try {
      const res = await fetch('/next-api/admin/players/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId, otherIds: group.players.map((p) => p.id).filter((id) => id !== primaryId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось объединить карточки', 'error');
        return;
      }
      showToast(`Карточки «${group.tag}» объединены`, 'success');
      onMerged();
    } catch {
      showToast('Не удалось объединить карточки', 'error');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border/20">
        <div>
          <span className="font-semibold">{group.tag}</span>
          <span className="ml-3 text-xs text-muted-foreground">{gameLabel} · суммарно {total} очков</span>
        </div>
        <button
          onClick={merge}
          disabled={!!group.conflict || merging}
          className="bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-1.5 rounded-lg font-medium transition-colors"
        >
          {merging ? 'Объединение...' : 'Объединить'}
        </button>
      </div>
      {group.conflict && (
        <div className="flex items-center gap-2 px-5 py-2 text-xs text-yellow-500 border-b border-border/20">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {group.conflict}: возможно, это тёзки. Автоматически такие карточки не объединяются.
        </div>
      )}
      {group.players.map((p) => (
        <label key={p.id} className="flex items-start gap-3 px-5 py-3 border-b border-border/10 last:border-b-0 cursor-pointer hover:bg-white/[0.02]">
          <input
            type="radio"
            name={group.key}
            className="mt-1"
            checked={primaryId === p.id}
            onChange={() => setPrimaryId(p.id)}
            disabled={!!group.conflict}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm">
              <span className="font-medium">{p.points} очков</span>
              <span className="text-muted-foreground"> · турниров {p.tournamentsPlayed} · побед {p.wins} · топ-3 {p.top3}</span>
            </div>
            <div className="text-xs text-muted-foreground break-words">{accountsOf(p)}</div>
          </div>
          {primaryId === p.id && !group.conflict && <span className="text-xs text-green-400 shrink-0">основная</span>}
        </label>
      ))}
    </div>
  );
}

export function PlayersAdminView() {
  const { labels } = useGames();
  const { data: groups, mutate, isLoading } = useSWR<DuplicateGroup[]>('/next-api/admin/players/duplicates', fetcher);

  return (
    <div className="px-6 pt-6 pb-12">
      <div className="flex justify-end mb-6"><HeaderActions /></div>

      <h1 className="text-lg font-semibold mb-1">Дубликаты игроков</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Карточки с одинаковым ником (без учёта регистра) в одной дисциплине. Такое возникает, когда игрок появился из разных
        площадок — например, Challonge и start.gg. При объединении очки и турниры суммируются, а выбранная карточка получает
        аккаунты всех площадок. Новые результаты с совпадающим ником теперь попадают в существующую карточку автоматически.
      </p>

      <ManualMerge gameLabels={labels} onMerged={() => { void mutate(); }} />

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
      ) : (groups?.length ?? 0) === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Дубликатов не найдено</div>
      ) : (
        <div className="space-y-4">
          {(groups ?? []).map((g) => (
            <GroupCard key={g.key} group={g} gameLabel={labels[g.game] ?? g.game} onMerged={() => { void mutate(); }} />
          ))}
        </div>
      )}
    </div>
  );
}
