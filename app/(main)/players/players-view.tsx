'use client';

import React, { useState, useMemo } from 'react';
import { Search, Trophy, Target, Medal } from 'lucide-react';
import { mockPlayers } from '@/src/data/mock-players';
import { Player } from '@/src/types/player';
import { GAME_LABELS, GAME_COLORS, REGION_LABELS, GameType, RegionType } from '@/src/types';
import { Modal } from '@/src/components/common/modal';

const ALL_GAMES: GameType[] = ['tekken8','sf6','guilty_gear','marvel_tokon','multi_game','other'];
const ALL_REGIONS: RegionType[] = ['russia','belarus','kazakhstan','ukraine','cis','europe','other'];

export function PlayersView() {
  const [search, setSearch] = useState('');
  const [filterGame, setFilterGame] = useState<GameType | ''>('');
  const [filterRegion, setFilterRegion] = useState<RegionType | ''>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const filtered = useMemo(() => {
    return (mockPlayers ?? []).filter((p: Player) => {
      if (search && !(p?.tag ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterGame && p?.mainGame !== filterGame) return false;
      if (filterRegion && p?.region !== filterRegion) return false;
      return true;
    });
  }, [search, filterGame, filterRegion]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Игроки</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Поиск по тегу..." className="bg-transparent text-sm outline-none w-44" value={search} onChange={(e: any) => setSearch(e?.target?.value ?? '')} />
        </div>
        <select value={filterGame} onChange={(e: any) => setFilterGame(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="">Все игры</option>
          {ALL_GAMES.map((g: GameType) => <option key={g} value={g}>{GAME_LABELS[g]}</option>)}
        </select>
        <select value={filterRegion} onChange={(e: any) => setFilterRegion(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="">Все регионы</option>
          {ALL_REGIONS.map((r: RegionType) => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
        </select>
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
      <Modal isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} title={selectedPlayer?.tag ?? ''}>
        {selectedPlayer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: GAME_COLORS[selectedPlayer?.mainGame] ?? '#666' }}>
                {(selectedPlayer?.tag ?? '?')[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedPlayer?.tag}</h3>
                <div className="text-sm text-muted-foreground">{selectedPlayer?.realName}</div>
                <div className="text-xs text-muted-foreground">{selectedPlayer?.country} • {REGION_LABELS[selectedPlayer?.region]}</div>
              </div>
            </div>
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: GAME_COLORS[selectedPlayer?.mainGame] }}>{GAME_LABELS[selectedPlayer?.mainGame]}</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3 text-center"><Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" /><div className="text-lg font-bold">{selectedPlayer?.wins}</div><div className="text-xs text-muted-foreground">Побед</div></div>
              <div className="bg-white/5 rounded-lg p-3 text-center"><Medal className="w-5 h-5 mx-auto mb-1 text-orange-500" /><div className="text-lg font-bold">{selectedPlayer?.top3}</div><div className="text-xs text-muted-foreground">Топ-3</div></div>
              <div className="bg-white/5 rounded-lg p-3 text-center"><Target className="w-5 h-5 mx-auto mb-1 text-blue-500" /><div className="text-lg font-bold">{selectedPlayer?.tournamentsPlayed}</div><div className="text-xs text-muted-foreground">Турниров</div></div>
              <div className="bg-white/5 rounded-lg p-3 text-center"><div className="text-lg font-bold text-[#EF4444]">{selectedPlayer?.points}</div><div className="text-xs text-muted-foreground">Очков</div></div>
            </div>
            {(selectedPlayer?.socialLinks?.discord || selectedPlayer?.socialLinks?.twitter || selectedPlayer?.socialLinks?.twitch) && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Соц. сети</h4>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {selectedPlayer?.socialLinks?.discord && <span className="bg-white/5 px-2 py-1 rounded">Discord: {selectedPlayer.socialLinks.discord}</span>}
                  {selectedPlayer?.socialLinks?.twitter && <span className="bg-white/5 px-2 py-1 rounded">Twitter: {selectedPlayer.socialLinks.twitter}</span>}
                  {selectedPlayer?.socialLinks?.twitch && <span className="bg-white/5 px-2 py-1 rounded">Twitch: {selectedPlayer.socialLinks.twitch}</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
