'use client';

import React, { useState, useCallback } from 'react';
import { Globe, Send, Upload } from 'lucide-react';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { GameType, RegionType, FormatType, REGION_LABELS, FORMAT_LABELS } from '@/src/types';
import { MAX_BANNER_BYTES, isAllowedBannerMimeType } from '@/src/lib/banner-constraints';
import { tournamentDurationDays, MAX_TOURNAMENT_DURATION_DAYS } from '@/lib/date-validation';
import { useGames } from '@/src/hooks/use-games';

const REPORT_FORM_REGIONS: RegionType[] = ['russia', 'belarus', 'kazakhstan', 'usa', 'japan', 'cis', 'other'];
const REPORT_FORM_FORMATS: FormatType[] = ['online', 'offline'];
const START_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const START_MINUTES = ['00', '10', '20', '30', '40', '50'];

const EMPTY_REPORT_FORM = {
  name: '',
  url: '',
  communicationUrl: '',
  comment: '',
  startDate: '',
  endDate: '',
  startHour: '19',
  startMinute: '00',
  region: '' as RegionType | '',
  city: '',
  game: '' as GameType | '',
  format: '' as FormatType | '',
  bannerUrl: '',
  website: '',
};

export function HeaderActions() {
  const { games } = useGames();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLangToast, setShowLangToast] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportForm, setReportForm] = useState(EMPTY_REPORT_FORM);

  const handleLangClick = useCallback(() => {
    setShowLangToast(true);
    setTimeout(() => setShowLangToast(false), 2500);
  }, []);

  const handleBannerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!isAllowedBannerMimeType(file.type)) {
      showToast('Баннер должен быть в формате JPEG или PNG', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      showToast(`Размер баннера не должен превышать ${MAX_BANNER_BYTES / 1024 / 1024} МБ`, 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReportForm(prev => ({ ...prev, bannerUrl: (reader.result as string) ?? '' }));
    reader.readAsDataURL(file);
  }, []);

  const durationError = (reportForm?.startDate && reportForm?.endDate && reportForm.endDate >= reportForm.startDate
    && tournamentDurationDays(reportForm.startDate, reportForm.endDate) > MAX_TOURNAMENT_DURATION_DAYS)
    ? `Продолжительность турнира не может быть более ${MAX_TOURNAMENT_DURATION_DAYS} суток`
    : '';

  const isOffline = reportForm?.format === 'offline';

  const isReportFormValid = !!(
    reportForm?.name?.trim?.() &&
    reportForm?.startDate &&
    reportForm?.endDate &&
    reportForm?.startHour &&
    reportForm?.startMinute &&
    reportForm?.game &&
    reportForm?.format &&
    (!isOffline || (reportForm?.region && reportForm?.city?.trim?.())) &&
    !durationError
  );

  const handleReportSubmit = useCallback(async () => {
    if (!isReportFormValid || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/next-api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportForm.name.trim(),
          url: reportForm.url,
          communicationUrl: reportForm.communicationUrl,
          comment: reportForm.comment,
          startDate: reportForm.startDate,
          endDate: reportForm.endDate,
          startTime: `${reportForm.startHour}:${reportForm.startMinute}`,
          region: reportForm.region || undefined,
          city: reportForm.city || undefined,
          game: reportForm.game,
          format: reportForm.format,
          bannerUrl: reportForm.bannerUrl || undefined,
          website: reportForm.website,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        showToast(data?.error ?? 'Не удалось отправить заявку, попробуйте ещё раз', 'error');
        return;
      }
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
        setReportForm(EMPTY_REPORT_FORM);
      }, 1500);
    } catch {
      showToast('Не удалось отправить заявку, попробуйте ещё раз', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [reportForm, isReportFormValid, submitting]);

  return (
    <>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleLangClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-sm"
        >
          <Globe className="w-4 h-4" />
          RU
        </button>

        <button
          onClick={() => setShowReportModal(true)}
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Сообщить о турнире
        </button>
      </div>

      {/* Lang toast */}
      {showLangToast && (
        <div className="fixed top-16 right-6 z-50 bg-[#1A1A2E] border border-border/50 text-foreground text-sm px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          Русский — единственный доступный язык
        </div>
      )}

      {/* Report tournament modal */}
      <Modal isOpen={showReportModal} onClose={() => { setShowReportModal(false); setReportSent(false); setReportForm(EMPTY_REPORT_FORM); }} title="Сообщить о турнире">
        {reportSent ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-foreground font-medium">Спасибо!</p>
            <p className="text-muted-foreground text-sm mt-1">Ваша заявка принята к рассмотрению</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Название турнира *</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                value={reportForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, name: e?.target?.value ?? '' }))}
                placeholder="Например: Evo Japan 2025"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Ссылка на турнир</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                value={reportForm.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, url: e?.target?.value ?? '' }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Тип турнира *</label>
              <select
                className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                value={reportForm.format}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportForm(prev => ({ ...prev, format: (e?.target?.value ?? '') as FormatType | '' }))}
              >
                <option value="" className="bg-[#1A1A2E] text-foreground">Выберите тип турнира</option>
                {REPORT_FORM_FORMATS.map((f: FormatType) => <option key={f} value={f} className="bg-[#1A1A2E] text-foreground">{FORMAT_LABELS[f]}</option>)}
              </select>
            </div>
            {isOffline && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Регион *</label>
                  <select
                    className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                    value={reportForm.region}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportForm(prev => ({ ...prev, region: (e?.target?.value ?? '') as RegionType | '' }))}
                  >
                    <option value="" className="bg-[#1A1A2E] text-foreground">Выберите регион</option>
                    {REPORT_FORM_REGIONS.map((r: RegionType) => <option key={r} value={r} className="bg-[#1A1A2E] text-foreground">{REGION_LABELS[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Город *</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                    value={reportForm.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, city: e?.target?.value ?? '' }))}
                    placeholder="Например: Москва"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Дата начала *</label>
                <input
                  type="date"
                  className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                  value={reportForm.startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, startDate: e?.target?.value ?? '' }))}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Дата завершения *</label>
                <input
                  type="date"
                  className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50 ${durationError ? 'border-red-500' : 'border-border/50'}`}
                  value={reportForm.endDate}
                  min={reportForm.startDate || undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, endDate: e?.target?.value ?? '' }))}
                />
                {durationError && <span className="text-xs text-red-500 mt-1 block">{durationError}</span>}
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Время начала *</label>
                <div className="flex items-center gap-1.5">
                  <select
                    className="w-full bg-white/5 border border-border/50 rounded-lg px-2 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                    value={reportForm.startHour}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportForm(prev => ({ ...prev, startHour: e?.target?.value ?? '' }))}
                  >
                    {START_HOURS.map((h) => <option key={h} value={h} className="bg-[#1A1A2E] text-foreground">{h}</option>)}
                  </select>
                  <span className="text-muted-foreground shrink-0">:</span>
                  <select
                    className="w-full bg-white/5 border border-border/50 rounded-lg px-2 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                    value={reportForm.startMinute}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportForm(prev => ({ ...prev, startMinute: e?.target?.value ?? '' }))}
                  >
                    {START_MINUTES.map((m) => <option key={m} value={m} className="bg-[#1A1A2E] text-foreground">{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Дисциплина *</label>
              <select
                className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                value={reportForm.game}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportForm(prev => ({ ...prev, game: (e?.target?.value ?? '') as GameType | '' }))}
              >
                <option value="" className="bg-[#1A1A2E] text-foreground">Выберите дисциплину</option>
                {games.map((g) => <option key={g.key} value={g.key} className="bg-[#1A1A2E] text-foreground">{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Баннер турнира</label>
              <label className="flex items-center gap-2 w-full bg-white/5 border border-dashed border-border/50 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:border-[#EF4444]/50 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 shrink-0" />
                <span className="truncate">{reportForm.bannerUrl ? 'Изображение выбрано' : 'Загрузить JPEG или PNG'}</span>
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleBannerChange} />
              </label>
              <p className="text-xs text-muted-foreground mt-1">Только JPEG или PNG, не более {MAX_BANNER_BYTES / 1024 / 1024} МБ</p>
              {reportForm.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reportForm.bannerUrl} alt="Превью баннера" className="mt-2 h-24 w-full object-cover rounded-lg border border-border/30" />
              )}
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Описание турнира</label>
              <textarea
                className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50 resize-none h-20"
                value={reportForm.comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportForm(prev => ({ ...prev, comment: e?.target?.value ?? '' }))}
                placeholder="Расскажите подробнее..."
              />
            </div>
            {reportForm.format === 'online' && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Канал для коммуникации игроков</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                  value={reportForm.communicationUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, communicationUrl: e?.target?.value ?? '' }))}
                  placeholder="Discord-сервер или Telegram-канал турнира"
                />
              </div>
            )}
            <div className="h-0 w-0 overflow-hidden">
              <input
                type="text"
                name="website"
                value={reportForm.website}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, website: e?.target?.value ?? '' }))}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </div>
            <button
              onClick={handleReportSubmit}
              disabled={!isReportFormValid || submitting}
              className="w-full bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
