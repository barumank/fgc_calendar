'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeaderActions } from '@/src/components/layout/header-actions';

interface ExportLogRow {
  id: string;
  platform: string;
  serverId: string;
  successCount: number;
  failCount: number;
  createdAt: string;
}

const PLATFORMS: { key: string; label: string }[] = [
  { key: 'discord', label: 'Экспорт в Дискорд' },
  { key: 'telegram', label: 'Экспорт в Телеграм' },
  { key: 'google', label: 'Экспорт в Google' },
  { key: 'yandex', label: 'Экспорт в Яндекс' },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function SystemLogsView() {
  const [platform, setPlatform] = useState('discord');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [platform]);

  const { data, isLoading } = useSWR<{ items: ExportLogRow[]; total: number; totalPages: number }>(
    `/next-api/admin/export-log?platform=${platform}&page=${page}`,
    fetcher,
  );

  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>

      <div className="flex flex-wrap gap-2 mb-6">
        {PLATFORMS.map((p) => (
          <button key={p.key} onClick={() => setPlatform(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${platform === p.key ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        <div className="grid grid-cols-[180px_1fr_120px_120px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border/20">
          <div>Дата</div><div>ID сервера</div><div>Успешно</div><div>Неуспешно</div>
        </div>
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Записей пока нет</div>
        ) : (data?.items ?? []).map((row) => (
          <div key={row.id} className="grid grid-cols-[180px_1fr_120px_120px] gap-4 px-6 py-3 items-center text-sm border-b border-border/10 last:border-b-0">
            <div className="text-muted-foreground">{formatDateTime(row.createdAt)}</div>
            <div className="font-mono truncate">{row.serverId}</div>
            <div className="text-green-400 font-medium">{row.successCount}</div>
            <div className={row.failCount > 0 ? 'text-red-400 font-medium' : 'text-muted-foreground'}>{row.failCount}</div>
          </div>
        ))}
      </div>

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">Страница {page} из {data?.totalPages ?? 1}</span>
          <button
            onClick={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
            disabled={page === (data?.totalPages ?? 1)}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
