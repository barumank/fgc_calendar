'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useGames } from '@/src/hooks/use-games';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';
import { formatDateRange } from '@/src/lib/format-date';
import { League } from '@/src/lib/leagues';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const EMPTY_FORM = { name: '', game: '', startDate: '', endDate: '', registrationUrl: '', discordUrl: '' };

export function LeaguesAdminView() {
  const { games, labels, colors } = useGames();
  const { data: leagues, mutate, isLoading } = useSWR<League[]>('/next-api/leagues', fetcher);
  const [modalLeague, setModalLeague] = useState<League | null | 'new'>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => { setForm({ ...EMPTY_FORM, game: games[0]?.key ?? '' }); setModalLeague('new'); };
  const openEdit = (l: League) => {
    setForm({
      name: l.name,
      game: l.game,
      startDate: l.startDate,
      endDate: l.endDate,
      registrationUrl: l.registrationUrl ?? '',
      discordUrl: l.discordUrl ?? '',
    });
    setModalLeague(l);
  };
  const closeModal = () => { setModalLeague(null); setForm(EMPTY_FORM); };

  const datesInvalid = !!(form.startDate && form.endDate && form.startDate > form.endDate);
  const isValid = !!(form.name.trim() && form.game && form.startDate && form.endDate && !datesInvalid);

  const handleSubmit = async () => {
    if (!isValid || submitting || !modalLeague) return;
    setSubmitting(true);
    try {
      const isNew = modalLeague === 'new';
      const url = isNew ? '/next-api/admin/leagues' : `/next-api/admin/leagues/${modalLeague.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: form.name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось сохранить лигу', 'error');
        return;
      }
      await mutate();
      showToast(isNew ? 'Лига добавлена' : 'Лига обновлена', 'success');
      closeModal();
    } catch {
      showToast('Не удалось сохранить лигу', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (l: League) => {
    if (deletingId) return;
    if (!window.confirm(`Удалить лигу «${l.name}»?`)) return;
    setDeletingId(l.id);
    try {
      const res = await fetch(`/next-api/admin/leagues/${l.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось удалить лигу', 'error');
        return;
      }
      await mutate();
      showToast(`Лига «${l.name}» удалена`, 'success');
    } catch {
      showToast('Не удалось удалить лигу', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = 'w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50';

  return (
    <div className="px-6 pt-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />Добавить
        </button>
        <HeaderActions />
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Лиги показываются посетителям в разделе «Лиги» на временной шкале, по строкам дисциплин.
      </p>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : (leagues?.length ?? 0) === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Лиг пока нет</div>
        ) : (leagues ?? []).map((l) => (
          <div key={l.id} className="flex items-center gap-4 px-6 py-3 border-b border-border/10 last:border-b-0">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[l.game] ?? '#666' }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{l.name}</div>
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                <span>{labels[l.game] ?? l.game}</span>
                <span>{formatDateRange(l.startDate, l.endDate)}</span>
                {l.registrationUrl && (
                  <a href={l.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#EF4444] hover:underline">
                    Регистрация <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {l.discordUrl && (
                  <a href={l.discordUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#EF4444] hover:underline">
                    Discord <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openEdit(l)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                title="Редактировать"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(l)}
                disabled={deletingId === l.id}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!modalLeague} onClose={closeModal} title={modalLeague === 'new' ? 'Новая лига' : 'Редактировать лигу'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Название *</label>
            <input
              type="text"
              className={inputClass}
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, name: e?.target?.value ?? '' }))}
              placeholder="Например: МК лига"
              maxLength={120}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Дисциплина *</label>
            <select
              className={inputClass}
              value={form.game}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((prev) => ({ ...prev, game: e?.target?.value ?? '' }))}
            >
              <option value="" className="bg-[#1A1A2E] text-foreground">Выберите дисциплину</option>
              {games.map((g) => <option key={g.key} value={g.key} className="bg-[#1A1A2E] text-foreground">{g.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Дата начала *</label>
              <input
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, startDate: e?.target?.value ?? '' }))}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Дата окончания *</label>
              <input
                type="date"
                className={`${inputClass} ${datesInvalid ? 'border-red-500' : ''}`}
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, endDate: e?.target?.value ?? '' }))}
              />
            </div>
          </div>
          {datesInvalid && <p className="text-xs text-red-500 -mt-2">Дата начала не может быть позже даты окончания</p>}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Ссылка на регистрацию</label>
            <input
              type="text"
              className={inputClass}
              value={form.registrationUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, registrationUrl: e?.target?.value ?? '' }))}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Ссылка на Discord</label>
            <input
              type="text"
              className={inputClass}
              value={form.discordUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, discordUrl: e?.target?.value ?? '' }))}
              placeholder="https://discord.gg/..."
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
