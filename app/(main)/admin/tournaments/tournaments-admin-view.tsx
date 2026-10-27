'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Pencil, Search } from 'lucide-react';
import { useGames } from '@/src/hooks/use-games';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';
import { formatDateRange } from '@/src/lib/format-date';
import { MAX_BANNER_BYTES, isAllowedBannerMimeType } from '@/src/lib/banner-constraints';
import { REGION_LABELS, STATUS_LABELS } from '@/src/types/tournament';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TournamentRow {
  id: string;
  name: string;
  game: string;
  format: string;
  region: string;
  city: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  status: string;
  playersCount: number;
  description: string;
  organizerName: string;
  sourceUrl: string | null;
  communicationUrl: string | null;
  resultsFetchedAt: string | null;
}

type BannerChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; dataUrl: string };

const inputClass = 'w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50';
const optionClass = 'bg-[#1A1A2E] text-foreground';

function toForm(t: TournamentRow) {
  return {
    name: t.name,
    game: t.game,
    format: t.format,
    region: t.format === 'offline' ? t.region : 'russia',
    city: t.city ?? '',
    startDate: t.startDate,
    endDate: t.endDate,
    startTime: t.startTime ?? '',
    status: t.status,
    playersCount: String(t.playersCount ?? 0),
    description: t.description,
    organizerName: t.organizerName,
    sourceUrl: t.sourceUrl ?? '',
    communicationUrl: t.communicationUrl ?? '',
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function TournamentsAdminView() {
  const { games, labels, colors } = useGames();
  const { data: tournaments, mutate, isLoading } = useSWR<TournamentRow[]>('/next-api/tournaments', fetcher);

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<TournamentRow | null>(null);
  const [form, setForm] = useState<ReturnType<typeof toForm> | null>(null);
  // The list endpoint leaves banners out (they can be several MB each), so the
  // current one is fetched for the tournament being edited.
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [bannerChange, setBannerChange] = useState<BannerChange>({ kind: 'keep' });
  const [submitting, setSubmitting] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...(tournaments ?? [])]
      .sort((a, b) => (b.startDate + (b.startTime ?? '')).localeCompare(a.startDate + (a.startTime ?? '')))
      .filter((t) => !q || t.name.toLowerCase().includes(q) || (t.city ?? '').toLowerCase().includes(q));
  }, [tournaments, search]);

  const openEdit = async (t: TournamentRow) => {
    setEditing(t);
    setForm(toForm(t));
    setBannerChange({ kind: 'keep' });
    setCurrentBanner(null);
    try {
      const full = await fetch(`/next-api/tournaments/${t.id}`).then((r) => r.json());
      setCurrentBanner(full?.bannerUrl ?? null);
    } catch {
      // The banner preview is optional; editing the rest still works.
    }
  };
  const closeEdit = () => { setEditing(null); setForm(null); setCurrentBanner(null); setBannerChange({ kind: 'keep' }); };

  const set = (key: keyof ReturnType<typeof toForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => (prev ? { ...prev, [key]: e?.target?.value ?? '' } : prev));

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!isAllowedBannerMimeType(file.type)) {
      showToast('Баннер должен быть в формате JPEG или PNG', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      showToast(`Размер баннера не должен превышать ${MAX_BANNER_BYTES / 1024 / 1024} МБ`, 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBannerChange({ kind: 'replace', dataUrl: (reader.result as string) ?? '' });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isOffline = form?.format === 'offline';
  const datesInvalid = !!(form?.startDate && form?.endDate && form.startDate > form.endDate);
  const isValid = !!(
    form && form.name.trim() && form.game && form.startDate && form.endDate && !datesInvalid
    && (!isOffline || (form.region && form.city.trim()))
  );

  const handleSubmit = async () => {
    if (!form || !editing || !isValid || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { ...form, playersCount: Number(form.playersCount || 0) };
      if (bannerChange.kind === 'remove') body.bannerUrl = null;
      if (bannerChange.kind === 'replace') body.bannerUrl = bannerChange.dataUrl;

      const res = await fetch(`/next-api/admin/tournaments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось сохранить турнир', 'error');
        return;
      }
      await mutate();
      showToast('Турнир обновлён', 'success');
      closeEdit();
    } catch {
      showToast('Не удалось сохранить турнир', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const bannerPreview = bannerChange.kind === 'replace' ? bannerChange.dataUrl : bannerChange.kind === 'remove' ? null : currentBanner;

  return (
    <div className="px-6 pt-6 pb-12">
      <div className="flex justify-end mb-6"><HeaderActions /></div>

      <h1 className="text-lg font-semibold mb-1">Управление турнирами</h1>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Здесь можно исправить любые данные опубликованного турнира: город, даты, ссылки, описание и баннер.
      </p>

      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          className={`${inputClass} pl-9`}
          placeholder="Поиск по названию или городу"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e?.target?.value ?? '')}
        />
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Турниров не найдено</div>
        ) : visible.map((t) => (
          <div key={t.id} className="flex items-center gap-4 px-6 py-3 border-b border-border/10 last:border-b-0">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[t.game] ?? '#666' }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{t.name}</div>
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>{labels[t.game] ?? t.game}</span>
                <span>{formatDateRange(t.startDate, t.endDate)}</span>
                <span>{t.format === 'online' ? 'Online' : [t.city, REGION_LABELS[t.region as keyof typeof REGION_LABELS]].filter(Boolean).join(', ')}</span>
                <span>{STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] ?? t.status}</span>
              </div>
            </div>
            <button
              onClick={() => { void openEdit(t); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
              title="Редактировать"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={closeEdit} title="Редактировать турнир" maxWidth="max-w-3xl">
        {form && editing && (
          <div className="space-y-4">
            <Field label="Название *">
              <input type="text" className={inputClass} value={form.name} onChange={set('name')} maxLength={200} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Дисциплина *">
                <select
                  className={inputClass}
                  value={form.game}
                  onChange={set('game')}
                  disabled={!!editing.resultsFetchedAt}
                  title={editing.resultsFetchedAt ? 'Результаты уже загружены — дисциплину менять нельзя' : undefined}
                >
                  {games.map((g) => <option key={g.key} value={g.key} className={optionClass}>{g.label}</option>)}
                </select>
              </Field>
              <Field label="Формат *">
                <select className={inputClass} value={form.format} onChange={set('format')}>
                  <option value="offline" className={optionClass}>Offline</option>
                  <option value="online" className={optionClass}>Online</option>
                </select>
              </Field>
              <Field label="Статус *">
                <select className={inputClass} value={form.status} onChange={set('status')}>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key} className={optionClass}>{label}</option>)}
                </select>
              </Field>
            </div>

            {isOffline && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Регион *">
                  <select className={inputClass} value={form.region} onChange={set('region')}>
                    {Object.entries(REGION_LABELS).map(([key, label]) => <option key={key} value={key} className={optionClass}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Город *">
                  <input type="text" className={inputClass} value={form.city} onChange={set('city')} />
                </Field>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Дата начала *">
                <input type="date" className={inputClass} value={form.startDate} onChange={set('startDate')} />
              </Field>
              <Field label="Дата завершения *">
                <input type="date" className={`${inputClass} ${datesInvalid ? 'border-red-500' : ''}`} value={form.endDate} min={form.startDate || undefined} onChange={set('endDate')} />
              </Field>
              <Field label="Время начала (МСК)">
                <input type="time" className={inputClass} value={form.startTime} onChange={set('startTime')} />
              </Field>
            </div>
            {datesInvalid && <p className="text-xs text-red-500 -mt-2">Дата начала не может быть позже даты завершения</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Организатор">
                <input type="text" className={inputClass} value={form.organizerName} onChange={set('organizerName')} />
              </Field>
              <Field label="Участников">
                <input type="number" min={0} step={1} className={inputClass} value={form.playersCount} onChange={set('playersCount')} />
              </Field>
            </div>

            <Field label="Ссылка на турнир (Challonge, start.gg, crowdhype)">
              <input type="text" className={inputClass} value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://..." />
            </Field>
            <Field label="Ссылка для общения (Discord, Telegram)">
              <input type="text" className={inputClass} value={form.communicationUrl} onChange={set('communicationUrl')} placeholder="https://..." />
            </Field>

            <Field label="Описание">
              <textarea className={`${inputClass} min-h-[100px] resize-y`} value={form.description} onChange={set('description')} maxLength={5000} />
            </Field>

            <Field label="Баннер (JPEG или PNG, 16:9, до 5 МБ)">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2 text-sm cursor-pointer transition-colors">
                  {bannerPreview ? 'Заменить изображение' : 'Загрузить изображение'}
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleBannerFile} />
                </label>
                {(bannerPreview || bannerChange.kind === 'replace') && (
                  <button type="button" onClick={() => setBannerChange({ kind: 'remove' })} className="text-sm text-red-400 hover:underline">
                    Удалить баннер
                  </button>
                )}
                {bannerChange.kind !== 'keep' && (
                  <button type="button" onClick={() => setBannerChange({ kind: 'keep' })} className="text-sm text-muted-foreground hover:text-foreground">
                    Отменить изменение
                  </button>
                )}
              </div>
              {bannerPreview ? (
                <img src={bannerPreview} alt="Баннер турнира" className="mt-3 w-full max-w-sm aspect-video object-cover rounded-lg border border-border/30" />
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">{bannerChange.kind === 'remove' ? 'Баннер будет удалён после сохранения.' : 'Баннера нет.'}</p>
              )}
            </Field>

            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="w-full bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
