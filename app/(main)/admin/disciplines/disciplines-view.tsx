'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useGames } from '@/src/hooks/use-games';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { GameRecord } from '@/src/data/default-games';
import { HeaderActions } from '@/src/components/layout/header-actions';

const EMPTY_FORM = { label: '', shortLabel: '', color: '#EF4444', startggVideogameId: '' };

export function DisciplinesView() {
  const { games, mutate, isLoading } = useGames();
  const [modalGame, setModalGame] = useState<GameRecord | null | 'new'>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => { setForm(EMPTY_FORM); setModalGame('new'); };
  const openEdit = (g: GameRecord) => { setForm({ label: g.label, shortLabel: g.shortLabel ?? '', color: g.color, startggVideogameId: g.startggVideogameId ?? '' }); setModalGame(g); };
  const closeModal = () => { setModalGame(null); setForm(EMPTY_FORM); };

  const isValid = !!(form.label.trim() && form.color);

  const handleSubmit = async () => {
    if (!isValid || submitting || !modalGame) return;
    setSubmitting(true);
    try {
      const isNew = modalGame === 'new';
      if (!isNew && !modalGame.id) return;
      const url = isNew ? '/next-api/admin/games' : `/next-api/admin/games/${modalGame.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: form.label.trim(), shortLabel: form.shortLabel.trim(), color: form.color, startggVideogameId: form.startggVideogameId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось сохранить дисциплину', 'error');
        return;
      }
      await mutate();
      showToast(isNew ? 'Дисциплина добавлена' : 'Дисциплина обновлена', 'success');
      closeModal();
    } catch {
      showToast('Не удалось сохранить дисциплину', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (g: GameRecord) => {
    if (deletingId || !g.id) return;
    if (!window.confirm(`Удалить дисциплину «${g.label}»?`)) return;
    setDeletingId(g.id);
    try {
      const res = await fetch(`/next-api/admin/games/${g.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось удалить дисциплину', 'error');
        return;
      }
      await mutate();
      showToast(`Дисциплина «${g.label}» удалена`, 'success');
    } catch {
      showToast('Не удалось удалить дисциплину', 'error');
    } finally {
      setDeletingId(null);
    }
  };

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
        Этот список используется во всех фильтрах и формах по всему сайту — в календаре, турнирах, игроках, рейтинге, экспорте, заявках и дашборде.
      </p>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        <div className="grid grid-cols-[48px_1fr_100px_140px_100px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border/20">
          <div></div><div>Название</div><div>Сокращение</div><div>Ключ</div><div>Действия</div>
        </div>
        {isLoading && (games?.length ?? 0) === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : (games ?? []).map((g: GameRecord) => (
          <div key={g.id ?? g.key} className="grid grid-cols-[48px_1fr_100px_140px_100px] gap-4 px-6 py-3 items-center text-sm border-b border-border/10 last:border-b-0">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: g.color }} />
            <div className="font-medium truncate">{g.label}</div>
            <div className="text-xs text-muted-foreground truncate">{g.shortLabel || '—'}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">{g.key}</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(g)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                title="Редактировать"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(g)}
                disabled={deletingId === g.id}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!modalGame} onClose={closeModal} title={modalGame === 'new' ? 'Новая дисциплина' : 'Редактировать дисциплину'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Название *</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
              value={form.label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, label: e?.target?.value ?? '' }))}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSubmit()}
              placeholder="Например: Tekken 8"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Сокращение</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
              value={form.shortLabel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, shortLabel: e?.target?.value ?? '' }))}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSubmit()}
              placeholder="Например: Tek8"
            />
            <p className="text-xs text-muted-foreground mt-1">Используется только в ячейках календарной сетки. Если не задано — покажется полное название.</p>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Цвет *</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-9 bg-white/5 border border-border/50 rounded-lg cursor-pointer"
                value={form.color}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, color: e?.target?.value ?? '#EF4444' }))}
              />
              <input
                type="text"
                className="flex-1 bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50 font-mono"
                value={form.color}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, color: e?.target?.value ?? '' }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">ID игры на start.gg</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50 font-mono"
              value={form.startggVideogameId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, startggVideogameId: e?.target?.value ?? '' }))}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSubmit()}
              placeholder="Например: 43868"
            />
            <p className="text-xs text-muted-foreground mt-1">Нужен только для импорта турниров со start.gg — так система понимает, какой из наших дисциплин соответствует игра на start.gg. Можно оставить пустым.</p>
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
