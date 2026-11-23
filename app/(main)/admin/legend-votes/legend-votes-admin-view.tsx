'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
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

interface LegendDraft {
  nickname: string;
  discipline: string;
  achievement: string;
  imageData: string;
  publishedAt: string | null;
}

function toLocalInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

async function compressImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Выберите PNG, JPG или WebP размером до 10 МБ');
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось прочитать изображение')); };
    image.src = url;
  });
  const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(source.width * scale); canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Не удалось обработать изображение');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.84);
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
  const [roundStatus, setRoundStatus] = useState<'open' | 'processing' | 'published'>('open');
  const [deadline, setDeadline] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draft, setDraft] = useState<LegendDraft>({ nickname: '', discipline: '', achievement: '', imageData: '', publishedAt: null });

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
      setRoundStatus(data.roundStatus);
      setDeadline(toLocalInput(data.deadlineAt));
      setDraft(data.card ? { nickname: data.card.nickname, discipline: data.card.discipline, achievement: data.card.achievement, imageData: data.card.imageData, publishedAt: data.card.publishedAt } : { nickname: '', discipline: '', achievement: '', imageData: '', publishedAt: null });
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
    if (!nextLegendNumber || roundStatus !== 'published' || !window.confirm(`Открыть голосование за легенду №${nextLegendNumber}?`)) return;
    setAdvancing(true);
    try {
      const response = await fetch('/next-api/admin/legend-votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'advance-round' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось открыть новый раунд');
      showToast(`Открыт раунд голосования №${data.activeLegendNumber}`, 'success');
      void loadVotes();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Ошибка открытия раунда', 'error'); }
    finally { setAdvancing(false); }
  };

  const postAction = async (action: string, payload: Record<string, unknown> = {}) => {
    const response = await fetch('/next-api/admin/legend-votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие');
    return data;
  };

  const saveDeadline = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingDeadline(true);
    try {
      await postAction('set-deadline', { deadlineAt: new Date(deadline).toISOString() });
      showToast('Срок голосования обновлён', 'success');
      void loadVotes();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Ошибка срока голосования', 'error'); }
    finally { setSavingDeadline(false); }
  };

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { const imageData = await compressImage(file); setDraft((value) => ({ ...value, imageData })); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Ошибка изображения', 'error'); }
    event.target.value = '';
  };

  const saveCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSavingCard(true);
    try {
      await postAction('save-card', { nickname: draft.nickname, discipline: draft.discipline, achievement: draft.achievement, imageData: draft.imageData });
      showToast('Карточка сохранена как черновик', 'success'); void loadVotes();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Ошибка сохранения карточки', 'error'); }
    finally { setSavingCard(false); }
  };

  const publishCard = async () => {
    if (!window.confirm(`Опубликовать легенду №${activeLegendNumber}? Карточка станет видна на странице.`)) return;
    setPublishing(true);
    try {
      await postAction('save-card', { nickname: draft.nickname, discipline: draft.discipline, achievement: draft.achievement, imageData: draft.imageData });
      await postAction('publish-card'); showToast('Легенда опубликована', 'success'); void loadVotes();
    }
    catch (error) { showToast(error instanceof Error ? error.message : 'Ошибка публикации', 'error'); }
    finally { setPublishing(false); }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex justify-end"><HeaderActions /></div>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold">Голосование за легенду</h1><p className="mt-1 text-sm text-muted-foreground">Текущий раунд: легенда №{activeLegendNumber}. Всего записей: {total}.</p></div>
          <button type="button" onClick={advanceRound} disabled={!nextLegendNumber || roundStatus !== 'published' || advancing} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            {advancing ? 'Открываем…' : nextLegendNumber ? `Опубликовать следующую Легенду и открыть раунд №${nextLegendNumber}` : 'Все раунды открыты'}
          </button>
        </header>

        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Раунд №{activeLegendNumber}: {roundStatus === 'open' ? 'голосование открыто' : roundStatus === 'processing' ? 'обработка результатов' : 'легенда опубликована'}</h2>
          {roundStatus === 'open' && <form onSubmit={saveDeadline} className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm">Голосование закрывается<input required type="datetime-local" value={deadline} min={toLocalInput(new Date().toISOString())} onChange={(event) => setDeadline(event.target.value)} className="mt-1 block rounded-md border border-border bg-background px-3 py-2" /></label><button disabled={savingDeadline} className="rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">{savingDeadline ? 'Сохраняем…' : 'Сохранить срок'}</button></form>}
          {roundStatus === 'processing' && <form onSubmit={saveCard} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr_1.2fr]"><label className="text-sm">Ник легенды<input required maxLength={80} value={draft.nickname} onChange={(event) => setDraft((value) => ({ ...value, nickname: event.target.value }))} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" /></label><label className="text-sm">Дисциплина<input required maxLength={100} value={draft.discipline} onChange={(event) => setDraft((value) => ({ ...value, discipline: event.target.value }))} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" /></label><label className="text-sm">Заслуга легенды<textarea required maxLength={2000} rows={3} value={draft.achievement} onChange={(event) => setDraft((value) => ({ ...value, achievement: event.target.value }))} className="mt-1 block w-full resize-y rounded-md border border-border bg-background px-3 py-2" /></label><div className="space-y-2"><label className="block text-sm">Фото или аватар<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} className="mt-1 block w-full text-xs" /></label>{draft.imageData && <img src={draft.imageData} alt="Предпросмотр карточки" className="h-20 w-20 rounded-lg object-cover" />}<p className="text-xs text-muted-foreground">PNG, JPG или WebP. Изображение автоматически сжимается.</p></div><div className="flex flex-wrap gap-2 lg:col-span-4"><button disabled={savingCard || !!draft.publishedAt} className="rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">{savingCard ? 'Сохраняем…' : 'Сохранить черновик'}</button><button type="button" onClick={publishCard} disabled={publishing || !draft.nickname || !draft.discipline || !draft.achievement || !draft.imageData} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{publishing ? 'Публикуем…' : 'Опубликовать легенду'}</button></div>{draft.publishedAt && <p className="text-sm text-emerald-400 lg:col-span-4">Опубликовано {formatDate(draft.publishedAt)}. Следующее действие — открыть новый раунд.</p>}</form>}
          {roundStatus === 'published' && <p className="mt-2 text-sm text-muted-foreground">Легенда №{activeLegendNumber} уже опубликована. После нажатия кнопки выше откроется новый раунд голосования на месяц.</p>}
        </section>

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
