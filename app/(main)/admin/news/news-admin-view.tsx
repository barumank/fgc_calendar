'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { NewsItem, NewsCategory, NEWS_CATEGORY_LABELS } from '@/src/types/news';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';

const CATEGORIES: NewsCategory[] = ['announcement', 'results', 'update', 'interview'];
const EMPTY_FORM = { title: '', category: 'announcement' as NewsCategory, content: '' };
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function NewsAdminView() {
  const { data: news, mutate, isLoading } = useSWR<NewsItem[]>('/next-api/news', fetcher);
  const [modalNews, setModalNews] = useState<NewsItem | null | 'new'>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => { setForm(EMPTY_FORM); setModalNews('new'); };
  const openEdit = (n: NewsItem) => { setForm({ title: n.title, category: n.category, content: n.content }); setModalNews(n); };
  const closeModal = () => { setModalNews(null); setForm(EMPTY_FORM); };

  const isValid = !!(form.title.trim() && form.content.trim() && form.category);

  const handleSubmit = async () => {
    if (!isValid || submitting || !modalNews) return;
    setSubmitting(true);
    try {
      const isNew = modalNews === 'new';
      const url = isNew ? '/next-api/admin/news' : `/next-api/admin/news/${modalNews.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), category: form.category, content: form.content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось сохранить новость', 'error');
        return;
      }
      if (isNew) {
        mutate((current) => [data, ...(current ?? [])], { revalidate: false });
      } else {
        mutate((current) => (current ?? []).map((n) => (n.id === data.id ? data : n)), { revalidate: false });
      }
      showToast(isNew ? 'Новость опубликована' : 'Новость обновлена', 'success');
      closeModal();
    } catch {
      showToast('Не удалось сохранить новость', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (n: NewsItem) => {
    if (deletingId) return;
    if (!window.confirm(`Удалить новость «${n.title}»?`)) return;
    setDeletingId(n.id);
    try {
      const res = await fetch(`/next-api/admin/news/${n.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось удалить новость', 'error');
        return;
      }
      mutate((current) => (current ?? []).filter((item) => item.id !== n.id), { revalidate: false });
      showToast('Новость удалена', 'success');
    } catch {
      showToast('Не удалось удалить новость', 'error');
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
          <Plus className="w-4 h-4" />Добавить новость
        </button>
        <HeaderActions />
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_120px_100px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border/20">
          <div>Название</div><div>Тип</div><div>Дата</div><div>Действия</div>
        </div>
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : (news?.length ?? 0) === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Новостей пока нет</div>
        ) : (news ?? []).map((n) => (
          <div key={n.id} className="grid grid-cols-[1fr_140px_120px_100px] gap-4 px-6 py-3 items-center text-sm border-b border-border/10 last:border-b-0">
            <div className="font-medium truncate">{n.title}</div>
            <div className="text-xs text-muted-foreground">{NEWS_CATEGORY_LABELS[n.category]}</div>
            <div className="text-xs text-muted-foreground">{formatDate(n.publishedAt)}</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(n)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                title="Редактировать"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(n)}
                disabled={deletingId === n.id}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!modalNews} onClose={closeModal} title={modalNews === 'new' ? 'Новая новость' : 'Редактировать новость'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Название *</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, title: e?.target?.value ?? '' }))}
              placeholder="Например: TEKKEN World Tour 2026 анонсирован"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Тип новости *</label>
            <select
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
              value={form.category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((prev) => ({ ...prev, category: e?.target?.value as NewsCategory }))}
            >
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#1A1A2E] text-foreground">{NEWS_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Текст новости *</label>
            <textarea
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50 resize-none h-32"
              value={form.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, content: e?.target?.value ?? '' }))}
              placeholder="Текст новости..."
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
