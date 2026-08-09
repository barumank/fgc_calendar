'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Plus, Check, RotateCcw } from 'lucide-react';
import { showToast } from '@/src/components/common/toast-notification';

interface BacklogItem {
  id: string;
  text: string;
  status: 'pending' | 'done';
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_LABELS: Record<BacklogItem['status'], string> = {
  pending: 'Не реализовано',
  done: 'Реализовано',
};

const STATUS_STYLES: Record<BacklogItem['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  done: 'bg-green-500/10 text-green-400',
};

export function BacklogView() {
  const { data: items, mutate, isLoading } = useSWR<BacklogItem[]>('/next-api/admin/backlog', fetcher);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<BacklogItem['status'] | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (items ?? []).filter((i) => !filterStatus || i.status === filterStatus);
  }, [items, filterStatus]);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/next-api/admin/backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось добавить задачу', 'error');
        return;
      }
      await mutate();
      setText('');
      showToast('Задача добавлена в бэклог', 'success');
    } catch {
      showToast('Не удалось добавить задачу', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item: BacklogItem) => {
    if (updatingId) return;
    setUpdatingId(item.id);
    try {
      const nextStatus = item.status === 'done' ? 'pending' : 'done';
      const res = await fetch(`/next-api/admin/backlog/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось обновить статус', 'error');
        return;
      }
      await mutate();
    } catch {
      showToast('Не удалось обновить статус', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="px-6">
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          className="flex-1 bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e?.target?.value ?? '')}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAdd()}
          placeholder="Описание задачи для бэклога..."
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || submitting}
          className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />Добавить
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilterStatus('')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!filterStatus ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Все</button>
        <button onClick={() => setFilterStatus('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'pending' ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Не реализовано</button>
        <button onClick={() => setFilterStatus('done')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'done' ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Реализовано</button>
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : (filtered?.length ?? 0) === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Пусто</div>
        ) : (filtered ?? []).map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-6 py-3 border-b border-border/10 last:border-b-0">
            <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[item.status]}`}>{STATUS_LABELS[item.status]}</span>
            <div className="flex-1 min-w-0 text-sm">{item.text}</div>
            <button
              onClick={() => toggleStatus(item)}
              disabled={updatingId === item.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors shrink-0"
            >
              {item.status === 'done' ? <><RotateCcw className="w-3.5 h-3.5" />Вернуть в бэклог</> : <><Check className="w-3.5 h-3.5" />Отметить реализованным</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
