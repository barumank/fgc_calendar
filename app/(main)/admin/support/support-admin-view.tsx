'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Donation {
  id: string;
  externalId: string | null;
  nickname: string;
  amount: number;
  message: string | null;
  paidAt: string;
  hidden: boolean;
}

interface Settings {
  goalAmount: number;
  donateUrl: string | null;
  developerMessage: string;
  hasDonatepayKey: boolean;
  autoPublish: boolean;
  lastSyncAt: string | null;
  lastAttemptAt: string | null;
}

const inputClass = 'w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50';

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm".
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyDonationForm() {
  return { nickname: '', amount: '', message: '', paidAt: toLocalInputValue(new Date()) };
}

export function SupportAdminView() {
  const { data: settings, mutate: mutateSettings } = useSWR<Settings>('/next-api/admin/support/settings', fetcher);
  const { data: donations, mutate: mutateDonations, isLoading } = useSWR<Donation[]>('/next-api/admin/support/donations', fetcher);

  const [settingsForm, setSettingsForm] = useState({ goalAmount: '', donateUrl: '', developerMessage: '', donatepayApiKey: '', autoPublish: false });
  const [syncing, setSyncing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyDonationForm());
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setSettingsForm({
      goalAmount: settings.goalAmount ? String(settings.goalAmount) : '',
      donateUrl: settings.donateUrl ?? '',
      developerMessage: settings.developerMessage ?? '',
      donatepayApiKey: '',
      autoPublish: settings.autoPublish,
    });
  }, [settings]);

  const saveSettings = async (): Promise<boolean> => {
    if (savingSettings) return false;
    setSavingSettings(true);
    try {
      const res = await fetch('/next-api/admin/support/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settingsForm, goalAmount: settingsForm.goalAmount === '' ? 0 : Number(settingsForm.goalAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось сохранить настройки', 'error');
        return false;
      }
      await mutateSettings(data, false);
      showToast('Настройки сохранены', 'success');
      return true;
    } catch {
      showToast('Не удалось сохранить настройки', 'error');
      return false;
    } finally {
      setSavingSettings(false);
    }
  };

  const syncNow = async () => {
    if (syncing) return;
    // A freshly typed key must be stored before the server can use it.
    if (settingsForm.donatepayApiKey && !(await saveSettings())) return;
    setSyncing(true);
    try {
      const res = await fetch('/next-api/admin/support/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось выполнить синхронизацию', 'error');
        return;
      }
      await Promise.all([mutateDonations(), mutateSettings()]);
      showToast(
        data.imported > 0
          ? `Загружено новых платежей: ${data.imported}${data.published ? '' : ' (скрыты до одобрения)'}`
          : 'Новых платежей нет',
        'success',
      );
    } catch {
      showToast('Не удалось выполнить синхронизацию', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const openCreate = () => { setForm(emptyDonationForm()); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setForm(emptyDonationForm()); };
  const donationValid = !!(form.nickname.trim() && Number(form.amount) >= 1 && form.paidAt);

  const addDonation = async () => {
    if (!donationValid || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/next-api/admin/support/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: form.nickname,
          amount: Number(form.amount),
          message: form.message,
          paidAt: new Date(form.paidAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось добавить платёж', 'error');
        return;
      }
      await mutateDonations();
      showToast('Платёж добавлен', 'success');
      closeModal();
    } catch {
      showToast('Не удалось добавить платёж', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHidden = async (d: Donation) => {
    if (busyId) return;
    setBusyId(d.id);
    try {
      const res = await fetch(`/next-api/admin/support/donations/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !d.hidden }),
      });
      if (!res.ok) {
        showToast((await res.json())?.error ?? 'Не удалось изменить платёж', 'error');
        return;
      }
      await mutateDonations();
    } catch {
      showToast('Не удалось изменить платёж', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteDonation = async (d: Donation) => {
    if (busyId) return;
    if (!window.confirm(`Удалить платёж от «${d.nickname}»?`)) return;
    setBusyId(d.id);
    try {
      const res = await fetch(`/next-api/admin/support/donations/${d.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast((await res.json())?.error ?? 'Не удалось удалить платёж', 'error');
        return;
      }
      await mutateDonations();
      showToast('Платёж удалён', 'success');
    } catch {
      showToast('Не удалось удалить платёж', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-6 pt-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />Добавить платёж
        </button>
        <HeaderActions />
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5 mb-6">
        <h2 className="text-base font-semibold mb-1">Настройки страницы «Поддержать проект»</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Цель задаётся на каждый месяц одним значением; сумма сборов считается с 1 по последнее число текущего месяца (МСК).
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Цель на месяц, ₽ (0 — не задана)</label>
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={settingsForm.goalAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((p) => ({ ...p, goalAmount: e?.target?.value ?? '' }))}
              placeholder="Например: 15000"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Ссылка кнопки «Помочь проекту»</label>
            <input
              type="text"
              className={inputClass}
              value={settingsForm.donateUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((p) => ({ ...p, donateUrl: e?.target?.value ?? '' }))}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">Если ссылка пуста, кнопка на странице не показывается.</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm text-muted-foreground mb-1.5">Сообщение от разработчика</label>
          <textarea
            className={`${inputClass} min-h-[160px] resize-y`}
            value={settingsForm.developerMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettingsForm((p) => ({ ...p, developerMessage: e?.target?.value ?? '' }))}
            maxLength={3000}
          />
          <p className="text-xs text-muted-foreground mt-1">Абзацы разделяйте пустой строкой.</p>
        </div>
        <button
          onClick={() => { void saveSettings(); }}
          disabled={savingSettings}
          className="mt-4 bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5 mb-6">
        <h2 className="text-base font-semibold mb-1">Автоматическая загрузка из DonatePay</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Раз в сутки сервер забирает из DonatePay успешные пожертвования в рублях. Уже загруженные платежи повторно не добавляются.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">API-ключ DonatePay</label>
            <input
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={settingsForm.donatepayApiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((p) => ({ ...p, donatepayApiKey: e?.target?.value ?? '' }))}
              placeholder={settings?.hasDonatepayKey ? 'Ключ сохранён — введите новый, чтобы заменить' : 'Вставьте ключ из личного кабинета DonatePay'}
            />
            <p className="text-xs text-muted-foreground mt-1">Ключ хранится только на сервере и на сайте не показывается.</p>
          </div>
          <div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={settingsForm.autoPublish}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettingsForm((p) => ({ ...p, autoPublish: !!e?.target?.checked }))}
              />
              <span>
                Сразу публиковать новые платежи
                <span className="block text-xs text-muted-foreground">
                  Если выключено, загруженные платежи появятся скрытыми, пока вы не нажмёте «Показать на сайте».
                </span>
              </span>
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={syncNow}
            disabled={syncing || (!settings?.hasDonatepayKey && !settingsForm.donatepayApiKey)}
            className="bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-foreground px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {syncing ? 'Загрузка...' : 'Синхронизировать сейчас'}
          </button>
          <span className="text-xs text-muted-foreground">
            {settings?.lastSyncAt
              ? `Последняя успешная загрузка: ${new Date(settings.lastSyncAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'short' })} МСК`
              : 'Загрузок ещё не было'}
            . Подробности — в «Системные логи → Платежи DonatePay».
          </span>
        </div>
      </div>

      <h2 className="text-base font-semibold mb-1">Платежи</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Скрытые платежи не учитываются в цели, топе и списке недавних. Платежи без пометки DonatePay добавлены вручную.
      </p>
      <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : (donations?.length ?? 0) === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Платежей пока нет</div>
        ) : (donations ?? []).map((d) => (
          <div key={d.id} className={`flex items-center gap-4 px-6 py-3 border-b border-border/10 last:border-b-0 ${d.hidden ? 'opacity-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 text-sm">
                <span className="font-medium truncate">{d.nickname}</span>
                <span className="font-bold">{d.amount.toLocaleString('ru-RU')} ₽</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(d.paidAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'short' })} МСК
                </span>
                <span className="text-xs text-muted-foreground">{d.externalId?.startsWith('donatepay:') ? 'DonatePay' : 'вручную'}</span>
                {d.hidden && <span className="text-xs text-yellow-500">скрыт</span>}
              </div>
              {d.message && <div className="text-xs text-muted-foreground italic mt-0.5 break-words">«{d.message}»</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleHidden(d)}
                disabled={busyId === d.id}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-40"
                title={d.hidden ? 'Показать на сайте' : 'Скрыть с сайта'}
              >
                {d.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => deleteDonation(d)}
                disabled={busyId === d.id}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title="Новый платёж">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Никнейм *</label>
            <input
              type="text"
              className={inputClass}
              value={form.nickname}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, nickname: e?.target?.value ?? '' }))}
              maxLength={60}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Сумма, ₽ *</label>
              <input
                type="number"
                min={1}
                step={1}
                className={inputClass}
                value={form.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, amount: e?.target?.value ?? '' }))}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Дата и время *</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.paidAt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, paidAt: e?.target?.value ?? '' }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Сообщение</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={form.message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, message: e?.target?.value ?? '' }))}
              maxLength={500}
            />
          </div>
          <button
            onClick={addDonation}
            disabled={!donationValid || submitting}
            className="w-full bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
