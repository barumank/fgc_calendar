'use client';

import React, { useState, useMemo } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { mockPlayers } from '@/src/data/mock-players';
import { Player } from '@/src/types/player';
import { GAME_LABELS, GAME_COLORS, GameType } from '@/src/types';

const RANKING_GAMES: GameType[] = ['tekken8','sf6','guilty_gear','marvel_tokon','multi_game'];

export function RankingsView() {
  const [selectedGame, setSelectedGame] = useState<GameType>('tekken8');

  const ranked = useMemo(() => {
    return (mockPlayers ?? [])
      .filter((p: Player) => p?.mainGame === selectedGame || selectedGame === 'multi_game')
      .sort((a: Player, b: Player) => (b?.points ?? 0) - (a?.points ?? 0));
  }, [selectedGame]);

  const medalColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Рейтинг</h1>
      <div className="flex gap-2 mb-6">
        {RANKING_GAMES.map((g: GameType) => (
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
        {(ranked ?? []).map((p: Player, idx: number) => (
          <div key={p?.id} className={`grid grid-cols-[60px_1fr_120px_80px_80px_80px_100px] gap-4 px-6 py-3 items-center text-sm ${
            idx < 3 ? 'bg-white/[0.02]' : ''
          } ${idx < (ranked?.length ?? 0) - 1 ? 'border-b border-border/10' : ''}`}>
            <div className="font-bold">
              {idx < 3 ? <Medal className={`w-5 h-5 ${medalColors[idx]}`} /> : <span className="text-muted-foreground">{idx + 1}</span>}
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
        ))}
      </div>
    </div>
  );
}
