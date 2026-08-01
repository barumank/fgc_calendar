'use client';

import React, { useState, useCallback } from 'react';
import { Settings, Moon, Globe, X, Send, Upload } from 'lucide-react';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { GameType, RegionType, FormatType, GAME_LABELS, REGION_LABELS, FORMAT_LABELS } from '@/src/types';
import { MAX_BANNER_BYTES, isAllowedBannerMimeType } from '@/src/lib/banner-constraints';

const REPORT_FORM_GAMES: GameType[] = ['tekken8', 'guilty_gear', 'marvel_tokon', 'sf6', 'avatar_legends', 'other'];
const REPORT_FORM_REGIONS: RegionType[] = ['russia', 'belarus', 'kazakhstan', 'usa', 'japan', 'cis', 'other'];
const REPORT_FORM_FORMATS: FormatType[] = ['online', 'offline'];

const EMPTY_REPORT_FORM = {
  name: '',
  url: '',
  comment: '',
  startDate: '',
  endDate: '',
  region: '' as RegionType | '',
  game: '' as GameType | '',
  format: '' as FormatType | '',
  bannerUrl: '',
};

export function Header() {
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

  const isReportFormValid = !!(
    reportForm?.name?.trim?.() &&
    reportForm?.startDate &&
    reportForm?.endDate &&
    reportForm?.region &&
    reportForm?.game &&
    reportForm?.format
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
          comment: reportForm.comment,
          startDate: reportForm.startDate,
          endDate: reportForm.endDate,
          region: reportForm.region,
          game: reportForm.game,
          format: reportForm.format,
          bannerUrl: reportForm.bannerUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error('Request failed');
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
      <header className="sticky top-0 z-30 h-14 bg-[#0D0D1A]/80 backdrop-blur-md border-b border-border/30 flex items-center justify-between px-6">
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <button
            onClick={handleLangClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-sm"
          >
            <Globe className="w-4 h-4" />
            RU
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Сообщить о турнире
          </button>
        </div>
      </header>

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
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                  value={reportForm.endDate}
                  min={reportForm.startDate || undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportForm(prev => ({ ...prev, endDate: e?.target?.value ?? '' }))}
                />
              </div>
            </div>
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
                <label className="block text-sm text-muted-foreground mb-1.5">Дисциплина *</label>
                <select
                  className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                  value={reportForm.game}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportForm(prev => ({ ...prev, game: (e?.target?.value ?? '') as GameType | '' }))}
                >
                  <option value="" className="bg-[#1A1A2E] text-foreground">Выберите дисциплину</option>
                  {REPORT_FORM_GAMES.map((g: GameType) => <option key={g} value={g} className="bg-[#1A1A2E] text-foreground">{GAME_LABELS[g]}</option>)}
                </select>
              </div>
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
              <label className="block text-sm text-muted-foreground mb-1.5">Комментарий</label>
              <textarea
                className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50 resize-none h-20"
                value={reportForm.comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportForm(prev => ({ ...prev, comment: e?.target?.value ?? '' }))}
                placeholder="Расскажите подробнее..."
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
