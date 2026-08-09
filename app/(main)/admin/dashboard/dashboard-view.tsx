'use client';

import React, { useMemo } from 'react';
import { Trophy, CalendarDays, Users, TrendingUp, UploadCloud, BarChart3, MapPin } from 'lucide-react';
import { mockTournaments } from '@/src/data/mock-tournaments';
import { mockPlayers } from '@/src/data/mock-players';
import { GameType, Tournament, FORMAT_LABELS } from '@/src/types';
import { Player } from '@/src/types/player';
import { useGames } from '@/src/hooks/use-games';
import { HeaderActions } from '@/src/components/layout/header-actions';

const stats = [
  { label: 'Всего турниров', value: mockTournaments?.length ?? 0, icon: Trophy, color: '#7C3AED' },
  { label: 'В этом месяце', value: (mockTournaments ?? []).filter((t: Tournament) => (t?.startDate ?? '').startsWith('2025-05'))?.length ?? 0, icon: CalendarDays, color: '#2563EB' },
  { label: 'Активных игроков', value: mockPlayers?.length ?? 0, icon: Users, color: '#16A34A' },
  { label: 'Предстоящих', value: (mockTournaments ?? []).filter((t: Tournament) => t?.status === 'upcoming')?.length ?? 0, icon: TrendingUp, color: '#EF4444' },
];

const recentTournaments = [...(mockTournaments ?? [])].sort((a: Tournament, b: Tournament) => (b?.startDate ?? '').localeCompare(a?.startDate ?? '')).slice(0, 5);
const upcomingTournaments = (mockTournaments ?? []).filter((t: Tournament) => t?.status === 'upcoming').sort((a: Tournament, b: Tournament) => (a?.startDate ?? '').localeCompare(b?.startDate ?? '')).slice(0, 5);

const mockExportLog = [
  { id: 'e1', platform: 'Discord', count: 8, date: '2025-05-10', status: 'Успешно' },
  { id: 'e2', platform: 'Telegram', count: 5, date: '2025-05-09', status: 'Успешно' },
  { id: 'e3', platform: 'Discord', count: 12, date: '2025-05-08', status: 'Успешно' },
  { id: 'e4', platform: 'Telegram', count: 3, date: '2025-05-07', status: 'Ошибка' },
  { id: 'e5', platform: 'Discord', count: 10, date: '2025-05-06', status: 'Успешно' },
];

export function DashboardView() {
  const { gameKeys: ALL_GAMES, labels: GAME_LABELS, colors: GAME_COLORS } = useGames();

  const gameDistribution = useMemo(() => {
    return ALL_GAMES.map((g: GameType) => ({
      game: g,
      count: (mockTournaments ?? []).filter((t: Tournament) => t?.game === g)?.length ?? 0,
    })).sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0));
  }, [ALL_GAMES]);

  const totalGames = gameDistribution.reduce((s: number, d) => s + (d?.count ?? 0), 0);

  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s: any) => {
          const Icon = s?.icon;
          return (
            <div key={s?.label} className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
              <div className="flex items-center justify-between">
                <div><div className="text-2xl font-bold font-mono">{s?.value}</div><div className="text-xs text-muted-foreground mt-1">{s?.label}</div></div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s?.color}20` }}>
                  {Icon && <Icon className="w-5 h-5" style={{ color: s?.color }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart placeholder */}
        <div className="lg:col-span-2 bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Турниры по месяцам</h2>
          <div className="flex items-end gap-3 h-48">
            {[{ m: 'Дек', v: 3 },{ m: 'Янв', v: 5 },{ m: 'Фев', v: 4 },{ m: 'Мар', v: 7 },{ m: 'Апр', v: 8 },{ m: 'Май', v: 25 }].map((d: any) => (
              <div key={d?.m} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#EF4444]/80 rounded-t-md transition-all" style={{ height: `${((d?.v ?? 0) / 25) * 100}%` }} />
                <span className="text-[10px] text-muted-foreground">{d?.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game distribution */}
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <h2 className="text-sm font-semibold mb-4">Топ игры</h2>
          <div className="space-y-3">
            {(gameDistribution ?? []).map((d: any) => (
              <div key={d?.game} className="space-y-1">
                <div className="flex justify-between text-xs"><span>{GAME_LABELS[d?.game as GameType]}</span><span className="text-muted-foreground">{d?.count} ({totalGames > 0 ? Math.round(((d?.count ?? 0) / totalGames) * 100) : 0}%)</span></div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${totalGames > 0 ? ((d?.count ?? 0) / totalGames) * 100 : 0}%`, backgroundColor: GAME_COLORS[d?.game as GameType] }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Recent */}
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <h2 className="text-sm font-semibold mb-3">Последние турниры</h2>
          <div className="space-y-2">
            {(recentTournaments ?? []).map((t: Tournament) => (
              <div key={t?.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: GAME_COLORS[t?.game] }} />
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{t?.name}</div><div className="text-xs text-muted-foreground">{t?.startDate}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <h2 className="text-sm font-semibold mb-3">Ближайшие события</h2>
          <div className="space-y-2">
            {(upcomingTournaments ?? []).map((t: Tournament) => (
              <div key={t?.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: GAME_COLORS[t?.game] }} />
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{t?.name}</div><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{t?.city}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Export log */}
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><UploadCloud className="w-4 h-4" />Активность экспорта</h2>
          <div className="space-y-2">
            {(mockExportLog ?? []).map((e: any) => (
              <div key={e?.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div><div className="text-sm font-medium">{e?.platform}</div><div className="text-xs text-muted-foreground">{e?.count} турниров • {e?.date}</div></div>
                <span className={`text-xs font-medium ${e?.status === 'Успешно' ? 'text-green-400' : 'text-red-400'}`}>{e?.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
