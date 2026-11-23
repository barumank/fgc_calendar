'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { HeaderActions } from '@/src/components/layout/header-actions';
import { showToast } from '@/src/components/common/toast-notification';

interface VoteRow {
  id: string;
  userLogin: string;
  userName: string | null;
  createdAt: string;
  legendNumber: number;
  nickname: string;
  roleLabel: string;
  comment: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Moscow' }).format(new Date(value));
}

export function LegendVotesAdminView() {
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [activeLegendNumber, setActiveLegendNumber] = useState(1);
  const [nextLegendNumber, setNextLegendNumber] = useState<number | null>(2);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [legendNumber, setLegendNumber] = useState('');
  const [applied, setApplied] = useState({ from: '', to: '', legendNumber: '' });
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const loadVotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (applied.from) params.set('from', applied.from);
      if (applied.to) params.set('to', applied.to);
      if (applied.legendNumber) params.set('legendNumber', applied.legendNumber);
      const response = await fetch(`/next-api/admin/legend-votes?${params}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить голоса');
      setVotes(data.votes); setActiveLegendNumber(data.activeLegendNumber); setNextLegendNumber(data.nextLegendNumber); setTotal(data.total);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Ошибка загрузки', 'error');
    } finally { setLoading(false); }
  }, [applied]);

  useEffect(() => { void loadVotes(); }, [loadVotes]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (from && to && from > to) { showToast('Дата начала должна быть не позже даты окончания', 'error'); return; }
    setApplied({ from, to, legendNumber });
  };

  const clearFilters = () => {
    setFrom(''); setTo(''); setLegendNumber(''); setApplied({ from: '', to: '', legendNumber: '' });
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (applied.from) params.set('from', applied.from);
      if (applied.to) params.set('to', applied.to);
      if (applied.legendNumber) params.set('legendNumber', applied.legendNumber);
      const response = await fetch(`/next-api/admin/legend-votes/export?${params}`);
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Не удалось выгрузить CSV'); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'legend-votes.csv'; link.click(); URL.revokeObjectURL(url);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Ошибка экспорта', 'error'); }
  };

  const advanceRound = async () => {
    if (!nextLegendNumber || !window.confirm(`Открыть голосование за легенду №${nextLegendNumber}? Текущий раунд №${activeLegendNumber} будет закрыт.`)) return;
    setAdvancing(true);
    try {
      const response = await fetch('/next-api/admin/legend-votes', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось открыть новый раунд');
      showToast(`Открыт раунд голосования №${data.activeLegendNumber}`, 'success');
      void loadVotes();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Ошибка открытия раунда', 'error'); }
    finally { setAdvancing(false); }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex justify-end"><HeaderActions /></div>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold">Голосование за легенду</h1><p className="mt-1 text-sm text-muted-foreground">Текущий раунд: легенда №{activeLegendNumber}. Всего записей: {total}.</p></div>
          <button type="button" onClick={advanceRound} disabled={!nextLegendNumber || advancing} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            {advancing ? 'Открываем…' : nextLegendNumber ? `Закрыть раунд и открыть №${nextLegendNumber}` : 'Все раунды открыты'}
          </button>
        </header>

        <form onSubmit={applyFilters} className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <label className="text-sm">Дата с<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block rounded-md border border-border bg-background px-3 py-2" /></label>
          <label className="text-sm">Дата по<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 block rounded-md border border-border bg-background px-3 py-2" /></label>
          <label className="text-sm">Номер легенды<select value={legendNumber} onChange={(event) => setLegendNumber(event.target.value)} className="mt-1 block min-w-40 rounded-md border border-border bg-background px-3 py-2"><option value="">Все раунды</option>{Array.from({ length: 24 }, (_, index) => <option key={index + 1} value={index + 1}>Легенда №{index + 1}</option>)}</select></label>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Применить</button>
          <button type="button" onClick={clearFilters} className="rounded-md border border-border px-4 py-2 text-sm">Сбросить</button>
          <button type="button" onClick={() => void exportCsv()} className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"><Download className="h-4 w-4"/>Скачать CSV</button>
          <button type="button" onClick={() => void loadVotes()} title="Обновить" className="rounded-md border border-border p-2"><RefreshCw className="h-4 w-4"/></button>
        </form>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Логин пользователя</th><th className="px-4 py-3">Дата голосования (МСК)</th><th className="px-4 py-3">№ легенды</th><th className="px-4 py-3">Никнейм</th><th className="px-4 py-3">Роль</th><th className="px-4 py-3">Комментарий</th></tr></thead>
              <tbody className="divide-y divide-border">
                {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Загружаем…</td></tr> : votes.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Голосов по выбранным фильтрам нет</td></tr> : votes.map((vote) => <tr key={vote.id} className="align-top hover:bg-muted/20"><td className="whitespace-nowrap px-4 py-3">{vote.userLogin || vote.userName || '—'}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(vote.createdAt)}</td><td className="px-4 py-3">{vote.legendNumber}</td><td className="px-4 py-3">{vote.nickname}</td><td className="px-4 py-3">{vote.roleLabel}</td><td className="max-w-[520px] whitespace-pre-wrap px-4 py-3">{vote.comment}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
