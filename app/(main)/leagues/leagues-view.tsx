'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useGames } from '@/src/hooks/use-games';
import { Modal } from '@/src/components/common/modal';
import { HeaderActions } from '@/src/components/layout/header-actions';
import { useSidebarLayout } from '@/src/components/layout/sidebar-layout-context';
import { formatDate, formatDateRange } from '@/src/lib/format-date';
import { League, LeagueStatus, DAY_MS, assignLanes, dayIndex, leagueStatus, todayString } from '@/src/lib/leagues';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LANE_HEIGHT = 40;
const ROW_PADDING = 12;
const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const STATUS_LABELS: Record<LeagueStatus, string> = { active: 'Идёт', upcoming: 'Скоро', ended: 'Завершена' };
const STATUS_STYLES: Record<LeagueStatus, string> = {
  active: 'bg-green-500/10 text-green-400',
  upcoming: 'bg-yellow-500/10 text-yellow-400',
  ended: 'bg-white/5 text-muted-foreground',
};

function pluralDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

function textOn(color: string) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (!m) return '#ffffff';
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111111' : '#ffffff';
}

function shortDate(date: string) {
  const [, m, d] = date.split('-');
  return `${d}.${m}`;
}

function progressInfo(league: League, status: LeagueStatus, today: string) {
  const startIdx = dayIndex(league.startDate);
  const endIdx = dayIndex(league.endDate);
  const todayIdx = dayIndex(today);
  if (status === 'upcoming') {
    const days = startIdx - todayIdx;
    return { percent: 0, text: `Старт через ${days} ${pluralDays(days)}` };
  }
  if (status === 'ended') return { percent: 100, text: '' };
  const total = endIdx - startIdx + 1;
  const left = endIdx - todayIdx;
  return {
    percent: Math.max(2, Math.round(((todayIdx - startIdx + 1) / total) * 100)),
    text: left === 0 ? 'Заканчивается сегодня' : `Осталось ${left} ${pluralDays(left)}`,
  };
}

function LeagueLinks({ league }: { league: League }) {
  if (!league.registrationUrl && !league.discordUrl) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {league.registrationUrl && (
        <a
          href={league.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          Регистрация <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
      {league.discordUrl && (
        <a
          href={league.discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          Discord <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

function LeagueCard({ league, today, color, gameLabel }: { league: League; today: string; color: string; gameLabel: string }) {
  const status = leagueStatus(league, today);
  const progress = progressInfo(league, status, today);
  return (
    <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold truncate">{league.name}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-3">{gameLabel} · {formatDateRange(league.startDate, league.endDate)}</div>
      {status !== 'ended' && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${progress.percent}%`, backgroundColor: color }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">{progress.text}</div>
        </div>
      )}
      <LeagueLinks league={league} />
    </div>
  );
}

interface Group {
  game: string;
  items: { league: League; lane: number }[];
  lanes: number;
}

function Timeline({
  groups,
  leagues,
  today,
  labels,
  colors,
  onSelect,
}: {
  groups: Group[];
  leagues: League[];
  today: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
  onSelect: (league: League) => void;
}) {
  const startIdx = Math.min(dayIndex(today), ...leagues.map((l) => dayIndex(l.startDate)));
  const endIdx = Math.max(...leagues.map((l) => dayIndex(l.endDate)));
  const total = endIdx - startIdx + 1;
  const pct = (idx: number) => ((idx - startIdx) / total) * 100;
  const todayPct = pct(dayIndex(today));

  const ticks: { pct: number; label: string }[] = [];
  const first = new Date(startIdx * DAY_MS);
  for (let k = 1; ; k++) {
    const monthStart = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + k, 1));
    const idx = Math.round(monthStart.getTime() / DAY_MS);
    if (idx > endIdx) break;
    const month = monthStart.getUTCMonth();
    ticks.push({ pct: pct(idx), label: month === 0 ? `${MONTHS_SHORT[month]} ${monthStart.getUTCFullYear()}` : MONTHS_SHORT[month] });
  }

  const gridLines = (
    <>
      {ticks.map((t) => (
        <div key={t.pct} className="absolute top-0 bottom-0 border-l border-border/30" style={{ left: `${t.pct}%` }} />
      ))}
      <div className="absolute top-0 bottom-0 border-l-2 border-[#3B82F6]" style={{ left: `${todayPct}%` }} />
    </>
  );

  return (
    <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-4 overflow-hidden">
      <div className="flex items-end gap-3 mb-1">
        <div className="w-[150px] shrink-0" />
        <div className="relative flex-1 h-5 text-xs text-muted-foreground">
          <span className="absolute text-[#60A5FA]" style={{ left: `${todayPct}%`, transform: todayPct > 90 ? 'translateX(-100%)' : undefined }}>Сегодня</span>
          {ticks.filter((t) => Math.abs(t.pct - todayPct) > 9 && t.pct < 94).map((t) => (
            <span key={t.pct} className="absolute" style={{ left: `${t.pct}%` }}>{t.label}</span>
          ))}
        </div>
      </div>

      {groups.map((group) => {
        const color = colors[group.game] ?? '#666666';
        return (
          <div key={group.game} className="flex gap-3 border-t border-border/20">
            <div className="w-[150px] shrink-0 flex items-center gap-2 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate" title={labels[group.game] ?? group.game}>{labels[group.game] ?? group.game}</span>
            </div>
            <div className="relative flex-1" style={{ height: group.lanes * LANE_HEIGHT + ROW_PADDING }}>
              {gridLines}
              {group.items.map(({ league, lane }) => {
                const status = leagueStatus(league, today);
                const left = pct(dayIndex(league.startDate));
                const width = Math.max(3, ((dayIndex(league.endDate) - dayIndex(league.startDate) + 1) / total) * 100);
                const solid = status === 'active' && lane % 2 === 0;
                const style: React.CSSProperties = {
                  left: `${left}%`,
                  width: `${Math.min(width, 100 - left)}%`,
                  top: ROW_PADDING / 2 + lane * LANE_HEIGHT,
                  height: LANE_HEIGHT - 8,
                  backgroundColor: solid ? color : `color-mix(in srgb, ${color} 30%, transparent)`,
                  border: solid ? 'none' : `1.5px ${status === 'upcoming' ? 'dashed' : 'solid'} ${color}`,
                  color: solid ? textOn(color) : undefined,
                };
                return (
                  <button
                    key={league.id}
                    onClick={() => onSelect(league)}
                    title={`${league.name} · ${formatDateRange(league.startDate, league.endDate)}`}
                    className="absolute flex items-center rounded-md px-2.5 text-xs font-medium text-left overflow-hidden whitespace-nowrap hover:brightness-110 transition"
                    style={style}
                  >
                    <span className="truncate">{league.name} · {shortDate(league.startDate)} — {shortDate(league.endDate)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LeaguesView() {
  const { games, labels, colors } = useGames();
  const { tier } = useSidebarLayout();
  const isMobile = tier === 'compact';
  const { data, isLoading } = useSWR<League[]>('/next-api/leagues', fetcher);
  const [today, setToday] = useState<string | null>(null);
  const [selected, setSelected] = useState<League | null>(null);
  const [showEnded, setShowEnded] = useState(false);

  useEffect(() => { setToday(todayString()); }, []);

  const { current, ended } = useMemo(() => {
    const all = Array.isArray(data) ? data : [];
    if (!today) return { current: [] as League[], ended: [] as League[] };
    return {
      current: all.filter((l) => leagueStatus(l, today) !== 'ended'),
      ended: all.filter((l) => leagueStatus(l, today) === 'ended').sort((a, b) => b.endDate.localeCompare(a.endDate)),
    };
  }, [data, today]);

  const groups: Group[] = useMemo(() => {
    const keys = [...games.map((g) => g.key), ...current.map((l) => l.game)];
    const ordered = [...new Set(keys)].filter((key) => current.some((l) => l.game === key));
    return ordered.map((game) => {
      const items = assignLanes(current.filter((l) => l.game === game));
      return { game, items, lanes: Math.max(...items.map((i) => i.lane)) + 1 };
    });
  }, [games, current]);

  const gameLabel = (key: string) => labels[key] ?? key;
  const gameColor = (key: string) => colors[key] ?? '#666666';

  const selectedStatus = selected && today ? leagueStatus(selected, today) : null;

  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>

      <h1 className="text-lg font-semibold mb-1">Лиги</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xl">
        Длительные лиги по дисциплинам: что идёт сейчас и что начнётся скоро.
      </p>

      {isLoading || !today ? (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      ) : current.length === 0 && ended.length === 0 ? (
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-6 text-sm text-muted-foreground max-w-xl">
          Лиг пока нет. Когда они появятся, здесь будет их расписание.
        </div>
      ) : (
        <div className="space-y-6">
          {current.length === 0 ? (
            <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-6 text-sm text-muted-foreground max-w-xl">
              Сейчас нет идущих и запланированных лиг.
            </div>
          ) : isMobile ? (
            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.game}>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gameColor(group.game) }} />
                    {gameLabel(group.game)}
                  </div>
                  <div className="space-y-3">
                    {group.items.map(({ league }) => (
                      <LeagueCard key={league.id} league={league} today={today} color={gameColor(group.game)} gameLabel={gameLabel(group.game)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Timeline groups={groups} leagues={current} today={today} labels={labels} colors={colors} onSelect={setSelected} />
          )}

          {ended.length > 0 && (
            <div>
              <button
                onClick={() => setShowEnded((v) => !v)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showEnded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Завершённые лиги ({ended.length})
              </button>
              {showEnded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {ended.map((league) => (
                    <LeagueCard key={league.id} league={league} today={today} color={gameColor(league.game)} gameLabel={gameLabel(league.game)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} maxWidth="max-w-md">
        {selected && selectedStatus && today && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gameColor(selected.game) }} />
                {gameLabel(selected.game)}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[selectedStatus]}`}>{STATUS_LABELS[selectedStatus]}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(selected.startDate)} — {formatDate(selected.endDate)}
            </div>
            {selected.registrationUrl || selected.discordUrl ? (
              <LeagueLinks league={selected} />
            ) : (
              <div className="text-sm text-muted-foreground">Ссылки пока не добавлены.</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
