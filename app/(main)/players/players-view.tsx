'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Search } from 'lucide-react';
import { Player } from '@/src/types/player';
import { REGION_LABELS, GameType, RegionType } from '@/src/types';
import { PlayerDetailModal } from '@/src/components/common/player-detail-modal';
import { useGames } from '@/src/hooks/use-games';
import { HeaderActions } from '@/src/components/layout/header-actions';

const ALL_REGIONS: RegionType[] = ['russia','belarus','kazakhstan','ukraine','cis','europe','other'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PlayersView() {
  const { gameKeys: ALL_GAMES, labels: GAME_LABELS, colors: GAME_COLORS } = useGames();
  const { data: players } = useSWR<Player[]>('/next-api/players', fetcher);
  const [search, setSearch] = useState('');
  const [filterGame, setFilterGame] = useState<GameType | ''>('');
  const [filterRegion, setFilterRegion] = useState<RegionType | ''>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const filtered = useMemo(() => {
    return (players ?? []).filter((p: Player) => {
      if (search && !(p?.tag ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterGame && p?.mainGame !== filterGame) return false;
      if (filterRegion && p?.region !== filterRegion) return false;
      return true;
    });
  }, [players, search, filterGame, filterRegion]);

  return (
    <div className="px-6 pt-6">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Поиск по тегу..." className="bg-transparent text-sm outline-none w-44" value={search} onChange={(e: any) => setSearch(e?.target?.value ?? '')} />
        </div>
        <select value={filterGame} onChange={(e: any) => setFilterGame(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="" className="bg-[#1A1A2E] text-foreground">Все игры</option>
          {ALL_GAMES.map((g: GameType) => <option key={g} value={g} className="bg-[#1A1A2E] text-foreground">{GAME_LABELS[g]}</option>)}
        </select>
        <select value={filterRegion} onChange={(e: any) => setFilterRegion(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="" className="bg-[#1A1A2E] text-foreground">Все регионы</option>
          {ALL_REGIONS.map((r: RegionType) => <option key={r} value={r} className="bg-[#1A1A2E] text-foreground">{REGION_LABELS[r]}</option>)}
        </select>
        <div className="ml-auto"><HeaderActions /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(filtered ?? []).map((p: Player) => (
          <button key={p?.id} onClick={() => setSelectedPlayer(p)} className="bg-[#1A1A2E] rounded-xl border border-border/30 p-4 text-left hover:border-border/60 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: GAME_COLORS[p?.mainGame] ?? '#666' }}>
                {(p?.tag ?? '?')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate group-hover:text-[#EF4444] transition-colors">{p?.tag}</div>
                <div className="text-xs text-muted-foreground">{p?.country}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: GAME_COLORS[p?.mainGame] }}>{GAME_LABELS[p?.mainGame]}</span>
              <span className="text-sm font-mono font-bold text-[#EF4444]">{p?.points} очков</span>
            </div>
          </button>
        ))}
      </div>
      <PlayerDetailModal player={selectedPlayer} gameLabels={GAME_LABELS} gameColors={GAME_COLORS} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
