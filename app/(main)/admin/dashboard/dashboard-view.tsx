'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { Trophy, CalendarDays, Users, TrendingUp, UploadCloud, BarChart3, MapPin } from 'lucide-react';
import { GameType, Tournament } from '@/src/types';
import { Player } from '@/src/types/player';
import { useGames } from '@/src/hooks/use-games';
import { HeaderActions } from '@/src/components/layout/header-actions';

const MONTH_ABBR = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function DashboardView() {
  const { gameKeys: ALL_GAMES, labels: GAME_LABELS, colors: GAME_COLORS } = useGames();
  const { data: tournaments } = useSWR<Tournament[]>('/next-api/tournaments', fetcher);
  const { data: players } = useSWR<Player[]>('/next-api/players', fetcher);

  const todayStr = useMemo(() => {
    const now = new Date();
    return dateStr(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const currentMonthPrefix = todayStr.slice(0, 7);

  const stats = useMemo(() => {
    const list = tournaments ?? [];
    return [
      { label: 'Всего турниров', value: list.length, icon: Trophy, color: '#7C3AED' },
      { label: 'В этом месяце', value: list.filter((t) => (t?.startDate ?? '').startsWith(currentMonthPrefix)).length, icon: CalendarDays, color: '#2563EB' },
      { label: 'Активных игроков', value: (players ?? []).length, icon: Users, color: '#16A34A' },
      { label: 'Предстоящих', value: list.filter((t) => (t?.endDate ?? '') >= todayStr).length, icon: TrendingUp, color: '#EF4444' },
    ];
  }, [tournaments, players, currentMonthPrefix, todayStr]);

  const recentTournaments = useMemo(() => (
    [...(tournaments ?? [])].sort((a, b) => (b?.startDate ?? '').localeCompare(a?.startDate ?? '')).slice(0, 5)
  ), [tournaments]);

  const upcomingTournaments = useMemo(() => (
    (tournaments ?? []).filter((t) => (t?.endDate ?? '') >= todayStr).sort((a, b) => (a?.startDate ?? '').localeCompare(b?.startDate ?? '')).slice(0, 5)
  ), [tournaments, todayStr]);

  const monthlyTournaments = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTH_ABBR[d.getMonth()], count: 0 });
    }
    for (const t of tournaments ?? []) {
      const bucket = months.find((m) => m.key === (t?.startDate ?? '').slice(0, 7));
      if (bucket) bucket.count += 1;
    }
    return months;
  }, [tournaments]);
  const maxMonthly = Math.max(1, ...monthlyTournaments.map((m) => m.count));

  const gameDistribution = useMemo(() => {
    return ALL_GAMES.map((g: GameType) => ({
      game: g,
      count: (tournaments ?? []).filter((t: Tournament) => t?.game === g)?.length ?? 0,
    })).sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0));
  }, [ALL_GAMES, tournaments]);

  const totalGames = gameDistribution.reduce((s: number, d) => s + (d?.count ?? 0), 0);

  const totalTournaments = (tournaments ?? []).length;
  const discordExportedCount = (tournaments ?? []).filter((t) => t?.discordEventId).length;

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
        {/* Monthly chart */}
        <div className="lg:col-span-2 bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Турниры по месяцам</h2>
          <div className="flex items-end gap-3 h-48">
            {monthlyTournaments.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#EF4444]/80 rounded-t-md transition-all" style={{ height: `${(d.count / maxMonthly) * 100}%` }} />
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
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
            {totalTournaments === 0 && <p className="text-xs text-muted-foreground">Турниров пока нет</p>}
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
            {upcomingTournaments.length === 0 && <p className="text-xs text-muted-foreground">Нет предстоящих турниров</p>}
          </div>
        </div>

        {/* Discord export summary */}
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><UploadCloud className="w-4 h-4" />Экспорт в Discord</h2>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <div className="text-2xl font-bold font-mono">{discordExportedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">из {totalTournaments} турниров экспортировано</div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#5865F2]/20">
              <UploadCloud className="w-5 h-5 text-[#5865F2]" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Telegram-экспорт пока не подключён к реальной отправке.</p>
        </div>
      </div>
    </div>
  );
}
