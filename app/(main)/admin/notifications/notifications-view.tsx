'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Hash } from 'lucide-react';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NotificationsView() {
  const { data, mutate, isLoading } = useSWR<{ notifyOnRequests: boolean; telegramChatId: string }>('/next-api/admin/notification-preference', fetcher);
  const { data: botSettings } = useSWR<{ botName: string; hasToken: boolean }>('/next-api/admin/settings/telegram', fetcher);
  const [notifyOnRequests, setNotifyOnRequests] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setNotifyOnRequests(data.notifyOnRequests);
      setTelegramChatId(data.telegramChatId ?? '');
    }
  }, [data]);

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/next-api/admin/notification-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyOnRequests, telegramChatId: telegramChatId.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result?.error ?? 'Не удалось сохранить настройки', 'error');
        return;
      }
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

      <div className="max-w-xl bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
        <h2 className="text-sm font-semibold mb-1">Уведомления о заявках</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Если включить, при появлении новой заявки на турнир вам придёт сообщение в Telegram на указанный Chat ID.
        </p>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4">Загрузка...</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
              Зайдите в Telegram с того аккаунта, на который вы бы хотели получать уведомления. Затем найдите в поиске нашего бота
              {botSettings?.botName ? <> (<span className="text-[#229ED9] font-medium">@{botSettings.botName.replace(/^@/, '')}</span>)</> : ''}.
              Напишите этому боту или нажмите "/start". В ответ бот вам сообщит ваш Chat ID — этот id укажите в разделе ниже.
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnRequests}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifyOnRequests(e?.target?.checked ?? false)}
                className="rounded border-border"
              />
              Участвовать в обработке заявок
            </label>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Chat ID</label>
              <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
                <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelegramChatId(e?.target?.value ?? '')}
                  className="bg-transparent text-sm outline-none flex-1"
                  placeholder="Например: 123456789"
                />
              </div>
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
