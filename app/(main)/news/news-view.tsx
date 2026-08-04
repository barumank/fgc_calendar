'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockNews } from '@/src/data/mock-news';
import { NewsItem, NewsCategory, NEWS_CATEGORY_LABELS } from '@/src/types/news';
import { Modal } from '@/src/components/common/modal';

const CATEGORIES: NewsCategory[] = ['announcement','results','update','interview'];
const CATEGORY_COLORS: Record<NewsCategory, string> = {
  announcement: '#EF4444',
  results: '#16A34A',
  update: '#2563EB',
  interview: '#D97706',
};
const PAGE_SIZE = 20;

export function NewsView() {
  const [filterCategory, setFilterCategory] = useState<NewsCategory | ''>('');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return (mockNews ?? []).filter((n: NewsItem) => {
      if (filterCategory && n?.category !== filterCategory) return false;
      return true;
    }).sort((a: NewsItem, b: NewsItem) => (b?.publishedAt ?? '').localeCompare(a?.publishedAt ?? ''));
  }, [filterCategory]);

  useEffect(() => { setPage(1); }, [filterCategory]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  return (
    <div className="px-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Новости</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilterCategory('')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!filterCategory ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Все</button>
        {CATEGORIES.map((c: NewsCategory) => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === c ? 'text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
            style={filterCategory === c ? { backgroundColor: CATEGORY_COLORS[c] } : {}}>
            {NEWS_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {(paginated ?? []).map((n: NewsItem) => (
          <button key={n?.id} onClick={() => setSelectedNews(n)} className="w-full text-left bg-[#1A1A2E] rounded-xl border border-border/30 p-5 hover:border-border/60 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600/30 to-red-600/30 flex items-center justify-center shrink-0">
                <Newspaper className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: CATEGORY_COLORS[n?.category] }}>{NEWS_CATEGORY_LABELS[n?.category]}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="w-3 h-3" />{n?.publishedAt}</span>
                </div>
                <h3 className="text-base font-semibold mb-1">{n?.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{n?.summary}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">Страница {page} из {totalPages}</span>
          <button
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      <Modal isOpen={!!selectedNews} onClose={() => setSelectedNews(null)} title={selectedNews?.title ?? ''}>
        {selectedNews && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: CATEGORY_COLORS[selectedNews?.category] }}>{NEWS_CATEGORY_LABELS[selectedNews?.category]}</span>
              <span className="text-sm text-muted-foreground">{selectedNews?.publishedAt}</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{selectedNews?.content}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
