'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { Trophy, Medal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Player } from '@/src/types/player';
import { GameType } from '@/src/types';
import { useGames } from '@/src/hooks/use-games';

const PAGE_SIZE = 20;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RankingsView() {
  const { gameKeys: ALL_GAMES, labels: GAME_LABELS, colors: GAME_COLORS } = useGames();
  const { data: players } = useSWR<Player[]>('/next-api/players', fetcher);
  const [selectedGame, setSelectedGame] = useState<GameType>('tekken8');
  const [page, setPage] = useState(1);

  const ranked = useMemo(() => {
    return (players ?? [])
      .filter((p: Player) => p?.mainGame === selectedGame || selectedGame === 'multi_game')
      .sort((a: Player, b: Player) => (b?.points ?? 0) - (a?.points ?? 0));
  }, [players, selectedGame]);

  useEffect(() => { setPage(1); }, [selectedGame]);

  const totalPages = Math.max(1, Math.ceil((ranked?.length ?? 0) / PAGE_SIZE));
  const paginated = useMemo(() => ranked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [ranked, page]);

  const medalColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Рейтинг</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_GAMES.map((g: GameType) => (
          <button key={g} onClick={() => setSelectedGame(g)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedGame === g ? 'text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
            style={selectedGame === g ? { backgroundColor: GAME_COLORS[g] } : {}}>
            {GAME_LABELS[g]}
          </button>
        ))}
      </div>
      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_120px_80px_80px_80px_100px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border/20">
          <div>#</div><div>Игрок</div><div>Страна</div><div>Очки</div><div>Турниры</div><div>Победы</div><div>Топ-3</div>
        </div>
        {(paginated ?? []).map((p: Player, idx: number) => {
          const rank = (page - 1) * PAGE_SIZE + idx;
          return (
            <div key={p?.id} className={`grid grid-cols-[60px_1fr_120px_80px_80px_80px_100px] gap-4 px-6 py-3 items-center text-sm ${
              rank < 3 ? 'bg-white/[0.02]' : ''
            } ${idx < (paginated?.length ?? 0) - 1 ? 'border-b border-border/10' : ''}`}>
              <div className="font-bold">
                {rank < 3 ? <Medal className={`w-5 h-5 ${medalColors[rank]}`} /> : <span className="text-muted-foreground">{rank + 1}</span>}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: GAME_COLORS[p?.mainGame] ?? '#666' }}>
                  {(p?.tag ?? '?')[0]?.toUpperCase()}
                </div>
                <span className="font-medium">{p?.tag}</span>
              </div>
              <div className="text-muted-foreground">{p?.country}</div>
              <div className="font-mono font-bold text-[#EF4444]">{p?.points}</div>
              <div className="text-muted-foreground">{p?.tournamentsPlayed}</div>
              <div className="text-muted-foreground">{p?.wins}</div>
              <div className="text-muted-foreground">{p?.top3}</div>
            </div>
          );
        })}
      </div>
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
    </div>
  );
}
