'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Settings, Key, Link as LinkIcon } from 'lucide-react';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SettingsView() {
  const { data, mutate, isLoading } = useSWR<{ hasToken: boolean; inviteUrl: string }>('/next-api/admin/settings/discord', fetcher);
  const [botToken, setBotToken] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data) setInviteUrl(data.inviteUrl ?? '');
  }, [data]);

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/next-api/admin/settings/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim(), inviteUrl: inviteUrl.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result?.error ?? 'Не удалось сохранить настройки', 'error');
        return;
      }
      setBotToken('');
      await mutate();
      showToast('Настройки сохранены', 'success');
    } catch {
      showToast('Не удалось сохранить настройки', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>
      <h1 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2"><Settings className="w-6 h-6" />Настройки</h1>

      <div className="max-w-xl bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
        <h2 className="text-sm font-semibold mb-1">Discord-бот для экспорта календаря</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Этот бот и токен используются для экспорта турниров в Discord всеми пользователями сайта (раздел "Экспорт календаря").
        </p>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4">Загрузка...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bot Token</label>
              <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
                <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="password"
                  value={botToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBotToken(e?.target?.value ?? '')}
                  className="bg-transparent text-sm outline-none flex-1"
                  placeholder={data?.hasToken ? 'Задан — оставьте пустым, чтобы не менять' : 'Токен не задан'}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ссылка-приглашение бота</label>
              <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={inviteUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteUrl(e?.target?.value ?? '')}
                  className="bg-transparent text-sm outline-none flex-1"
                  placeholder="https://discord.com/oauth2/authorize?..."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Показывается пользователям в разделе "Экспорт календаря", чтобы они могли добавить бота себе на сервер.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
