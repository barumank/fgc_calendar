'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { Hash, Pause, Play } from 'lucide-react';
import { useGames } from '@/src/hooks/use-games';
import { showToast } from '@/src/components/common/toast-notification';
import { TelegramBotInstructions } from '@/src/components/common/telegram-bot-instructions';
import { HeaderActions } from '@/src/components/layout/header-actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SubscriptionData {
  gameKeys: string[];
  paused: boolean;
}

function TelegramBlock() {
  const { data, mutate, isLoading } = useSWR<{ chatId: string }>('/next-api/tournament-subscription', fetcher);
  const [chatId, setChatId] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data) setChatId(data.chatId ?? '');
  }, [data]);

  const linked = !!data?.chatId;

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/next-api/tournament-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result?.error ?? 'Не удалось сохранить Chat ID', 'error');
        return;
      }
      await mutate();
      setEditing(false);
      showToast('Telegram привязан', 'success');
    } catch {
      showToast('Не удалось сохранить Chat ID', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
      <h2 className="text-sm font-semibold mb-1">1. Telegram</h2>
      <p className="text-xs text-muted-foreground mb-4">Сюда будут приходить уведомления о новых турнирах.</p>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-2">Загрузка...</div>
      ) : linked && !editing ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-green-400">Привязан</span>
            <span className="text-muted-foreground"> · Chat ID: {data?.chatId}</span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="bg-white/5 hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Изменить
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <TelegramBotInstructions />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Chat ID</label>
            <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={chatId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatId(e?.target?.value ?? '')}
                className="bg-transparent text-sm outline-none flex-1"
                placeholder="Например: 123456789"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={submitting || !chatId.trim()}
              className="bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Сохранение...' : 'Привязать'}
            </button>
            {linked && (
              <button
                onClick={() => { setEditing(false); setChatId(data?.chatId ?? ''); }}
                className="bg-white/5 hover:bg-white/10 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Отмена
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DisciplinesBlock() {
  const { games, colors } = useGames();
  const { data: chat } = useSWR<{ chatId: string }>('/next-api/tournament-subscription', fetcher);
  const { data, mutate, isLoading } = useSWR<SubscriptionData>('/next-api/discipline-subscription', fetcher);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setSelected(new Set(data.gameKeys ?? []));
  }, [data]);

  const telegramLinked = !!chat?.chatId;
  const savedKeys = data?.gameKeys ?? [];
  const hasSubscription = savedKeys.length > 0;

  const dirty = useMemo(() => {
    if (selected.size !== savedKeys.length) return true;
    return savedKeys.some((k) => !selected.has(k));
  }, [selected, savedKeys]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/next-api/discipline-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameKeys: [...selected] }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result?.error ?? 'Не удалось сохранить подписку', 'error');
        return;
      }
      await mutate(result, { revalidate: false });
      showToast(result.gameKeys.length === 0 ? 'Вы отписались от всех дисциплин' : 'Подписка сохранена', 'success');
    } catch {
      showToast('Не удалось сохранить подписку', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
      <h2 className="text-sm font-semibold mb-1">2. Дисциплины</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Выберите одну или несколько дисциплин — при создании нового турнира в календаре вы получите в Telegram его название,
        дату и время начала и ссылку на турнир.
      </p>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-2">Загрузка...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {games.map((g) => {
              const isSelected = selected.has(g.key);
              return (
                <button
                  key={g.key}
                  onClick={() => toggle(g.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSelected ? 'text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                  style={isSelected ? { backgroundColor: colors[g.key] } : {}}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          {!telegramLinked && (
            <p className="text-xs text-yellow-400">Сначала привяжите Telegram — без него подписку сохранить нельзя.</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !dirty || (selected.size > 0 && !telegramLinked)}
              className="bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
          {hasSubscription && (
            <p className="text-xs text-muted-foreground">Чтобы отписаться полностью, снимите все дисциплины и нажмите «Сохранить».</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBlock() {
  const { data, mutate } = useSWR<SubscriptionData>('/next-api/discipline-subscription', fetcher);
  const [toggling, setToggling] = useState(false);

  const hasSubscription = (data?.gameKeys?.length ?? 0) > 0;
  const paused = !!data?.paused;

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch('/next-api/discipline-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: !paused }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result?.error ?? 'Не удалось изменить статус подписки', 'error');
        return;
      }
      await mutate(result, { revalidate: false });
      showToast(result.paused ? 'Уведомления приостановлены' : 'Уведомления возобновлены', 'success');
    } catch {
      showToast('Не удалось изменить статус подписки', 'error');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="max-w-xl bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
      <h2 className="text-sm font-semibold mb-1">3. Статус подписки</h2>
      {hasSubscription ? (
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="text-sm">
            {paused ? (
              <span className="text-yellow-400">Приостановлена — уведомления не приходят</span>
            ) : (
              <span className="text-green-400">Активна — уведомления приходят</span>
            )}
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="shrink-0 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-sm px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? 'Возобновить' : 'Приостановить'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">Подписка ещё не оформлена — выберите дисциплины выше.</p>
      )}
    </div>
  );
}

export function SubscriptionView() {
  const { status } = useSession();

  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>

      <h1 className="text-lg font-semibold mb-1">Подписка на турниры</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xl">
        Получайте в Telegram уведомление каждый раз, когда в календаре появляется новый турнир по выбранной дисциплине.
      </p>

      {status === 'loading' ? (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      ) : status !== 'authenticated' ? (
        <div className="max-w-xl bg-[#1A1A2E] rounded-xl border border-border/30 p-5 text-sm text-muted-foreground">
          Чтобы оформить подписку, войдите на сайт — кнопка «Войти» в левом меню. Если у вас ещё нет аккаунта, напишите нашему
          боту в Telegram: в окне входа указано, как получить логин и пароль.
        </div>
      ) : (
        <div className="space-y-6">
          <TelegramBlock />
          <DisciplinesBlock />
          <StatusBlock />
        </div>
      )}
    </div>
  );
}
