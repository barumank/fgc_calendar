'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Search, MapPin, Users, DollarSign, CalendarDays, Wifi, WifiOff, ChevronDown, ChevronUp, ExternalLink, ArrowUpDown } from 'lucide-react';
import { Tournament, GAME_LABELS, GAME_COLORS, FORMAT_LABELS, REGION_LABELS, GameType, FormatType, RegionType } from '@/src/types';

const ALL_GAMES: GameType[] = ['tekken8','sf6','guilty_gear','marvel_tokon','avatar_legends','multi_game','other'];
const ALL_REGIONS: RegionType[] = ['russia','belarus','kazakhstan','usa','japan','ukraine','cis','europe','other'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TournamentsView() {
  const { data: tournaments } = useSWR<Tournament[]>('/next-api/tournaments', fetcher);
  const [search, setSearch] = useState('');
  const [filterGame, setFilterGame] = useState<GameType | ''>('');
  const [filterFormat, setFilterFormat] = useState<FormatType | ''>('');
  const [filterRegion, setFilterRegion] = useState<RegionType | ''>('');
  const [sortBy, setSortBy] = useState<'date' | 'prize' | 'players'>('date');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => setExpandedIds((prev: Set<string>) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const filtered = useMemo(() => {
    let items = (tournaments ?? []).filter((t: Tournament) => {
      if (search && !(t?.name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterGame && t?.game !== filterGame) return false;
      if (filterFormat && t?.format !== filterFormat) return false;
      if (filterRegion && t?.region !== filterRegion) return false;
      return true;
    });
    items.sort((a: Tournament, b: Tournament) => {
      if (sortBy === 'date') return (a?.startDate ?? '').localeCompare(b?.startDate ?? '');
      if (sortBy === 'prize') {
        const pa = parseInt((a?.prizePool ?? '0').replace(/[^0-9]/g, '') ?? '0') || 0;
        const pb = parseInt((b?.prizePool ?? '0').replace(/[^0-9]/g, '') ?? '0') || 0;
        return pb - pa;
      }
      return (b?.playersCount ?? 0) - (a?.playersCount ?? 0);
    });
    return items;
  }, [tournaments, search, filterGame, filterFormat, filterRegion, sortBy]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Турниры</h1>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Поиск по названию..." className="bg-transparent text-sm outline-none w-44" value={search} onChange={(e: any) => setSearch(e?.target?.value ?? '')} />
        </div>
        <select value={filterGame} onChange={(e: any) => setFilterGame(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="" className="bg-[#1A1A2E] text-foreground">Все игры</option>
          {ALL_GAMES.map((g: GameType) => <option key={g} value={g} className="bg-[#1A1A2E] text-foreground">{GAME_LABELS[g]}</option>)}
        </select>
        <select value={filterFormat} onChange={(e: any) => setFilterFormat(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="" className="bg-[#1A1A2E] text-foreground">Все форматы</option>
          <option value="online" className="bg-[#1A1A2E] text-foreground">Онлайн</option>
          <option value="offline" className="bg-[#1A1A2E] text-foreground">Офлайн</option>
        </select>
        <select value={filterRegion} onChange={(e: any) => setFilterRegion(e?.target?.value ?? '')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="" className="bg-[#1A1A2E] text-foreground">Все регионы</option>
          {ALL_REGIONS.map((r: RegionType) => <option key={r} value={r} className="bg-[#1A1A2E] text-foreground">{REGION_LABELS[r]}</option>)}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <select value={sortBy} onChange={(e: any) => setSortBy(e?.target?.value ?? 'date')} className="bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
            <option value="date" className="bg-[#1A1A2E] text-foreground">По дате</option>
            <option value="prize" className="bg-[#1A1A2E] text-foreground">По призовому фонду</option>
            <option value="players" className="bg-[#1A1A2E] text-foreground">По кол-ву игроков</option>
          </select>
        </div>
      </div>
      {/* List */}
      <div className="space-y-3">
        {(filtered ?? []).map((t: Tournament) => {
          const isExpanded = expandedIds.has(t?.id ?? '');
          return (
            <div key={t?.id} className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden transition-all hover:border-border/60">
              <div className="h-1" style={{ backgroundColor: GAME_COLORS[t?.game] ?? '#666' }} />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold truncate">{t?.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-white shrink-0" style={{ backgroundColor: GAME_COLORS[t?.game] }}>{GAME_LABELS[t?.game]}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">{t?.format === 'online' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}{FORMAT_LABELS[t?.format]}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{t?.startDate}{t?.endDate !== t?.startDate ? ` — ${t?.endDate}` : ''}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{t?.city}, {t?.country}</span>
                    </div>
                  </div>
                  <button onClick={() => toggleExpand(t?.id ?? '')} className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
                    <p className="text-sm text-muted-foreground">{t?.description}</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-muted-foreground" />{t?.prizePool}</div>
                      <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-muted-foreground" />{t?.playersCount} игроков</div>
                      <div className="text-sm text-muted-foreground">Организатор: <span className="text-foreground">{t?.organizerName}</span></div>
                    </div>
                    {t?.bracketUrl && (
                      <a href={t.bracketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#EF4444] hover:underline">
                        Турнирная сетка <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
