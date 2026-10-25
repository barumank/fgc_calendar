'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Award, Clock, Crown, Heart, MessageCircle, Medal, Target, Trophy } from 'lucide-react';
import { HeaderActions } from '@/src/components/layout/header-actions';
import type { RecentSupporter, SupportSummary, TopSupporter } from '@/lib/support';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GOAL_TICKS = [0, 0.25, 0.5, 0.75, 1];

function formatRub(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

function timeAgo(iso: string): string {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'только что';
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
  return rtf.format(Math.round(diffSec / (86400 * 30)), 'month');
}

function Card({ icon, title, subtitle, children, className = '' }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden ${className}`}>
      <div className="flex items-start gap-3 p-5 pb-4">
        <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground leading-9">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground -mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function GoalCard({ data }: { data: SupportSummary }) {
  const { goalAmount, collected, tipsCount, donateUrl, monthStart } = data;
  const percent = goalAmount > 0 ? Math.round((collected / goalAmount) * 100) : 0;
  const month = new Date(monthStart).toLocaleDateString('ru-RU', { month: 'long', timeZone: 'Europe/Moscow' });
  const remaining = Math.max(0, goalAmount - collected);

  return (
    <Card icon={<Target size={18} />} title="Цель этого месяца" subtitle={`Сбор на ${month}: хостинг, база данных и поддержка проекта`}>
      <div className="px-5 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="text-4xl font-bold text-foreground">
            {formatRub(collected)}
            {goalAmount > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">из {formatRub(goalAmount)}</span>}
          </div>
          {goalAmount > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{formatRub(remaining)}</span> осталось
            </div>
          )}
        </div>

        {goalAmount > 0 ? (
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-orange-400 transition-all"
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              {GOAL_TICKS.map((t) => <span key={t}>{formatRub(Math.round(goalAmount * t))}</span>)}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Цель на этот месяц пока не задана.</p>
        )}

        <div className="mt-5 grid grid-cols-2 divide-x divide-border/30 border-t border-border/30 pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Прогресс</div>
            <div className="mt-1 text-xl font-bold text-foreground">{goalAmount > 0 ? `${percent}%` : '—'}</div>
          </div>
          <div className="pl-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Платежей в этом месяце</div>
            <div className="mt-1 text-xl font-bold text-foreground">{tipsCount}</div>
          </div>
        </div>

        {donateUrl && (
          <a
            href={donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
          >
            <Heart size={16} className="fill-white" />
            Помочь проекту
          </a>
        )}
      </div>
    </Card>
  );
}

function DeveloperMessage({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <Card icon={<MessageCircle size={18} />} title="Сообщение от разработчика">
      <div className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-foreground/90">
        {paragraphs.length > 0
          ? paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)
          : <p className="text-muted-foreground">Сообщение пока не добавлено.</p>}
      </div>
    </Card>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={18} className="text-yellow-400" />;
  if (rank === 2) return <Trophy size={18} className="text-gray-300" />;
  if (rank === 3) return <Medal size={18} className="text-orange-400" />;
  return <Award size={18} className="text-muted-foreground/60" />;
}

function TopRow({ supporter, rank }: { supporter: TopSupporter; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? supporter.messages : supporter.messages.slice(0, 1);
  const hiddenCount = supporter.messages.length - shown.length;

  return (
    <li className={`border-t border-border/30 px-5 py-3.5 ${rank === 1 ? 'border-l-2 border-l-yellow-500/70 bg-yellow-500/[0.03]' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-5 flex justify-center"><RankIcon rank={rank} /></div>
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">{supporter.nickname}</span>
        {supporter.tips > 1 && (
          <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
            {supporter.tips} {supporter.tips < 5 ? 'платежа' : 'платежей'}
          </span>
        )}
        <span className="ml-auto shrink-0 text-lg font-bold text-foreground">{formatRub(supporter.total)}</span>
      </div>
      {shown.map((m, i) => (
        <blockquote key={i} className="mt-2 ml-8 border-l-2 border-border/50 pl-3 text-sm italic leading-relaxed text-muted-foreground">
          «{m.text}»
        </blockquote>
      ))}
      {hiddenCount > 0 && (
        <button onClick={() => setExpanded(true)} className="mt-2 ml-8 text-xs text-muted-foreground hover:text-foreground">
          Показать ещё сообщения: {hiddenCount}
        </button>
      )}
      {expanded && supporter.messages.length > 1 && (
        <button onClick={() => setExpanded(false)} className="mt-2 ml-8 text-xs text-muted-foreground hover:text-foreground">
          Свернуть
        </button>
      )}
    </li>
  );
}

function RecentRow({ item, latest }: { item: RecentSupporter; latest: boolean }) {
  return (
    <li className="border-t border-border/30 px-5 py-3.5">
      <div className="flex items-center gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">{item.nickname}</span>
        {latest && (
          <span className="shrink-0 rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
            Последний
          </span>
        )}
        <span className="ml-auto shrink-0 text-sm font-bold text-foreground">{formatRub(item.amount)}</span>
      </div>
      {item.message && (
        <blockquote className="mt-1.5 border-l-2 border-border/50 pl-3 text-sm italic leading-relaxed text-muted-foreground">
          «{item.message}»
        </blockquote>
      )}
      <div className="mt-1.5 text-xs text-muted-foreground/80">{timeAgo(item.paidAt)}</div>
    </li>
  );
}

export function SupportView() {
  const { data, isLoading } = useSWR<SupportSummary>('/next-api/support', fetcher);

  return (
    <div className="px-6 pt-6 pb-12">
      <div className="flex justify-end mb-6"><HeaderActions /></div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-pink-500/30 bg-pink-500/10 text-pink-400">
          <Heart size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Поддержать проект</h1>
          <p className="text-sm text-muted-foreground">
            Помогите сохранить FGC-calendar бесплатным и без рекламы для всего файтинг-сообщества.
          </p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="space-y-5">
          <GoalCard data={data} />
          <DeveloperMessage text={data.developerMessage} />

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <Card icon={<Trophy size={18} />} title="Топ поддержавших" subtitle="Суммарно за всё время">
              {data.top.length > 0 ? (
                <ul>{data.top.map((s, i) => <TopRow key={s.nickname} supporter={s} rank={i + 1} />)}</ul>
              ) : (
                <p className="border-t border-border/30 px-5 py-6 text-sm text-muted-foreground">Пока никого нет.</p>
              )}
            </Card>
            <Card icon={<Clock size={18} />} title="Недавние поддержавшие" subtitle="Последние 10 платежей">
              {data.recent.length > 0 ? (
                <ul>{data.recent.map((r, i) => <RecentRow key={r.id} item={r} latest={i === 0} />)}</ul>
              ) : (
                <p className="border-t border-border/30 px-5 py-6 text-sm text-muted-foreground">Пока никого нет.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
