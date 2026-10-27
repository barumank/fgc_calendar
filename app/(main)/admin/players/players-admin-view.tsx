'use client';

import React, { useState } from 'react';
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
