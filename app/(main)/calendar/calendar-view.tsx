'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Filter, MapPin, Users, DollarSign, CalendarDays, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { Tournament, GAME_LABELS, GAME_COLORS, FORMAT_LABELS, REGION_LABELS, GameType, FormatType, RegionType } from '@/src/types';
import { Modal } from '@/src/components/common/modal';
import { useClickOutside } from '@/src/hooks/use-click-outside';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DAY_NAMES = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTH_ABBR = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

const ALL_GAMES: GameType[] = ['tekken8','sf6','guilty_gear','marvel_tokon','avatar_legends','multi_game','other'];
const ALL_REGIONS: RegionType[] = ['russia','belarus','kazakhstan','usa','japan','ukraine','cis','europe','other'];

function getCalendarDays(year: number, month: number) {
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevDays - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, month, year, isCurrentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false });
  }
  return days;
}

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isTournamentOnDay(t: Tournament, y: number, m: number, d: number) {
  const ds = dateStr(y, m, d);
  return ds >= (t?.startDate ?? '') && ds <= (t?.endDate ?? '');
}

export function CalendarView() {
  const { data: tournaments } = useSWR<Tournament[]>('/next-api/tournaments', fetcher);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filterGames, setFilterGames] = useState<GameType[]>([]);
  const [filterFormat, setFilterFormat] = useState<FormatType | ''>('');
  const [filterRegions, setFilterRegions] = useState<RegionType[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const closeFilters = useCallback(() => setShowFilters(false), []);
  useClickOutside(filterRef, closeFilters);

  const filteredTournaments = useMemo(() => {
    return (tournaments ?? []).filter((t: Tournament) => {
      if ((filterGames?.length ?? 0) > 0 && !filterGames.includes(t?.game)) return false;
      if (filterFormat && t?.format !== filterFormat) return false;
      if ((filterRegions?.length ?? 0) > 0 && !filterRegions.includes(t?.region)) return false;
      if (filterDateFrom && (t?.endDate ?? '') < filterDateFrom) return false;
      if (filterDateTo && (t?.startDate ?? '') > filterDateTo) return false;
      return true;
    });
  }, [tournaments, filterGames, filterFormat, filterRegions, filterDateFrom, filterDateTo]);

  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y: number) => y - 1); }
    else setCurrentMonth((m: number) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y: number) => y + 1); }
    else setCurrentMonth((m: number) => m + 1);
  };
  const goToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const toggleGame = (g: GameType) => setFilterGames((prev: GameType[]) => prev.includes(g) ? prev.filter((x: GameType) => x !== g) : [...prev, g]);
  const toggleRegion = (r: RegionType) => setFilterRegions((prev: RegionType[]) => prev.includes(r) ? prev.filter((x: RegionType) => x !== r) : [...prev, r]);
  const resetFilters = () => { setFilterGames([]); setFilterFormat(''); setFilterRegions([]); setFilterDateFrom(''); setFilterDateTo(''); };

  const featuredTournament = (filteredTournaments ?? []).find((t: Tournament) => t?.featured);
  const todayStr = useMemo(() => {
    const now = new Date();
    return dateStr(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const upcomingTournaments = (filteredTournaments ?? [])
    .filter((t: Tournament) => (t?.endDate ?? '') >= todayStr)
    .sort((a: Tournament, b: Tournament) => {
      const dateDiff = (a?.startDate ?? '').localeCompare(b?.startDate ?? '');
      if (dateDiff !== 0) return dateDiff;
      return (a?.createdAt ?? '').localeCompare(b?.createdAt ?? '');
    })
    .slice(0, 6);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goToday} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">Сегодня</button>
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
            <h2 className="text-lg font-semibold">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
          </div>
          <div className="relative" ref={filterRef}>
            <button onClick={() => setShowFilters((p: boolean) => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-[#EF4444] text-white' : 'bg-white/5 hover:bg-white/10'}`}>
              <Filter className="w-4 h-4" /> Фильтры
              {((filterGames?.length ?? 0) + (filterRegions?.length ?? 0) + (filterFormat ? 1 : 0)) > 0 && (
                <span className="ml-1 bg-[#EF4444] text-white text-xs rounded-full px-1.5 py-0.5">{(filterGames?.length ?? 0) + (filterRegions?.length ?? 0) + (filterFormat ? 1 : 0)}</span>
              )}
            </button>
            {showFilters && (
              <div className="absolute right-0 top-12 w-[420px] bg-[#1A1A2E] rounded-xl border border-border/50 shadow-2xl p-5 z-50">
                <h3 className="text-sm font-semibold mb-3">Игра</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ALL_GAMES.map((g: GameType) => (
                    <button key={g} onClick={() => toggleGame(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterGames.includes(g) ? 'text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                      style={filterGames.includes(g) ? { backgroundColor: GAME_COLORS[g] } : {}}>
                      {GAME_LABELS[g]}
                    </button>
                  ))}
                </div>
                <h3 className="text-sm font-semibold mb-3">Формат</h3>
                <div className="flex gap-2 mb-4">
                  {(['online','offline'] as FormatType[]).map((f: FormatType) => (
                    <button key={f} onClick={() => setFilterFormat((prev: FormatType | '') => prev === f ? '' : f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterFormat === f ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                      {FORMAT_LABELS[f]}
                    </button>
                  ))}
                </div>
                <h3 className="text-sm font-semibold mb-3">Регион</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ALL_REGIONS.map((r: RegionType) => (
                    <button key={r} onClick={() => toggleRegion(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterRegions.includes(r) ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                      {REGION_LABELS[r]}
                    </button>
                  ))}
                </div>
                <h3 className="text-sm font-semibold mb-3">Диапазон дат</h3>
                <div className="flex gap-3 mb-4">
                  <input type="date" value={filterDateFrom} onChange={(e: any) => setFilterDateFrom(e?.target?.value ?? '')} className="flex-1 bg-white/5 border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground" />
                  <input type="date" value={filterDateTo} onChange={(e: any) => setFilterDateTo(e?.target?.value ?? '')} className="flex-1 bg-white/5 border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowFilters(false)} className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white py-2 rounded-lg text-sm font-medium transition-colors">Применить</button>
                  <button onClick={resetFilters} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm font-medium transition-colors">Сбросить</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
          <div className="grid grid-cols-7">
            {DAY_NAMES.map((d: string) => (<div key={d} className="text-center text-xs font-medium text-muted-foreground py-3 border-b border-border/20">{d}</div>))}
          </div>
          <div className="grid grid-cols-7">
            {(calendarDays ?? []).map((dayObj: any, idx: number) => {
              const dayTournaments = (filteredTournaments ?? []).filter((t: Tournament) => isTournamentOnDay(t, dayObj?.year, dayObj?.month, dayObj?.day));
              const visible = dayTournaments.slice(0, 4);
              const remaining = (dayTournaments?.length ?? 0) - 4;
              return (
                <div key={idx} className={`min-h-[165px] p-1.5 border-b border-r border-border/10 ${!dayObj?.isCurrentMonth ? 'opacity-30' : ''}`}>
                  <div className="text-xs text-muted-foreground mb-1 pl-1">{dayObj?.day}</div>
                  <div className="space-y-1">
                    {(visible ?? []).map((t: Tournament) => (
                      <button key={t?.id} onClick={() => setSelectedTournament(t)}
                        className="w-full text-left px-1.5 py-1 rounded text-[10px] font-medium text-white truncate flex items-center gap-1"
                        style={{ backgroundColor: GAME_COLORS[t?.game] ?? '#666' }}>
                        {t?.format === 'online' ? <Wifi className="w-2.5 h-2.5 shrink-0" /> : <WifiOff className="w-2.5 h-2.5 shrink-0" />}
                        <span className="truncate">{t?.name}</span>
                      </button>
                    ))}
                    {remaining > 0 && (
                      <Link
                        href={`/tournaments?date=${dateStr(dayObj?.year, dayObj?.month, dayObj?.day)}`}
                        className="block text-[10px] text-muted-foreground hover:text-[#EF4444] pl-1 transition-colors"
                      >
                        +{remaining} ещё
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4 justify-center">
          {ALL_GAMES.map((g: GameType) => (<div key={g} className="flex items-center gap-2"><div className="w-5 h-5 rounded-full" style={{ backgroundColor: GAME_COLORS[g] }} /><span className="text-2xl text-muted-foreground">{GAME_LABELS[g]}</span></div>))}
        </div>
      </div>
      <div className="w-[340px] shrink-0 space-y-4">
        {featuredTournament && (
          <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center">
              <span className="absolute top-3 left-3 bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded">FEATURED</span>
              <span className="text-white text-xl font-bold text-center px-4">{featuredTournament?.name}</span>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold">{featuredTournament?.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" />{featuredTournament?.startDate} — {featuredTournament?.endDate}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{featuredTournament?.city}, {featuredTournament?.country}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5" />{featuredTournament?.playersCount} игроков</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="w-3.5 h-3.5" />{featuredTournament?.prizePool}</div>
              <p className="text-xs text-muted-foreground mt-2">{featuredTournament?.description}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setSelectedTournament(featuredTournament)} className="flex-1 bg-white/5 hover:bg-white/10 text-sm py-2 rounded-lg transition-colors">Подробнее</button>
                {featuredTournament?.bracketUrl && (
                  <a href={featuredTournament.bracketUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm py-2 rounded-lg text-center flex items-center justify-center gap-1 transition-colors">Сетка <ExternalLink className="w-3.5 h-3.5" /></a>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-4">
          <h3 className="text-sm font-semibold mb-3">БЛИЖАЙШИЕ ТУРНИРЫ</h3>
          <div className="space-y-3">
            {(upcomingTournaments ?? []).map((t: Tournament) => (
              <button key={t?.id} onClick={() => setSelectedTournament(t)} className="w-full text-left flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="text-center shrink-0 w-12"><div className="text-[10px] text-muted-foreground uppercase">{MONTH_ABBR[(parseInt(t?.startDate?.split('-')?.[1] ?? '1', 10) - 1 + 12) % 12]}</div><div className="text-sm font-bold">{t?.startDate?.split('-')?.[2]?.replace(/^0/, '')}</div></div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t?.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{t?.format === 'online' ? 'Online' : t?.country}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: GAME_COLORS[t?.game] ?? '#666' }}>{GAME_LABELS[t?.game]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Modal isOpen={!!selectedTournament} onClose={() => setSelectedTournament(null)} title={selectedTournament?.name ?? ''}>
        {selectedTournament && (
          <div className="space-y-4">
            {selectedTournament?.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedTournament.bannerUrl} alt={selectedTournament?.name} className="w-full h-40 object-cover rounded-lg" />
            )}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: GAME_COLORS[selectedTournament?.game] }}>{GAME_LABELS[selectedTournament?.game]}</span>
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10">{FORMAT_LABELS[selectedTournament?.format]}</span>
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10">{REGION_LABELS[selectedTournament?.region]}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm"><CalendarDays className="w-4 h-4 text-muted-foreground" />{selectedTournament?.startDate} — {selectedTournament?.endDate}</div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" />{selectedTournament?.city}, {selectedTournament?.country}</div>
              <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-muted-foreground" />{selectedTournament?.playersCount} игроков</div>
            </div>
            <p className="text-sm text-muted-foreground">{selectedTournament?.description}</p>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-lg text-sm font-medium transition-colors">Подробнее</button>
              {selectedTournament?.bracketUrl && (
                <a href={selectedTournament.bracketUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white py-2.5 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1.5 transition-colors">Турнирная сетка <ExternalLink className="w-4 h-4" /></a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
