'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Search, Settings, Moon, Globe, X, Send } from 'lucide-react';
import { useClickOutside } from '@/src/hooks/use-click-outside';
import { Modal } from '@/src/components/common/modal';

export function Header() {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLangToast, setShowLangToast] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportForm, setReportForm] = useState({ name: '', url: '', comment: '' });
  const searchRef = useRef<HTMLDivElement>(null);

  const closeSearch = useCallback(() => setShowSearch(false), []);
  useClickOutside(searchRef, closeSearch);

  const handleLangClick = useCallback(() => {
    setShowLangToast(true);
    setTimeout(() => setShowLangToast(false), 2500);
  }, []);

  const handleReportSubmit = useCallback(() => {
    setReportSent(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSent(false);
      setReportForm({ name: '', url: '', comment: '' });
    }, 1500);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-[#0D0D1A]/80 backdrop-blur-md border-b border-border/30 flex items-center justify-between px-6">
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-1.5 gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск турниров, игроков..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e?.target?.value ?? '')}
              />
            </div>
          </div>

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
      <Modal isOpen={showReportModal} onClose={() => { setShowReportModal(false); setReportSent(false); setReportForm({ name: '', url: '', comment: '' }); }} title="Сообщить о турнире">
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
              disabled={!(reportForm?.name?.trim?.())}
              className="w-full bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Отправить
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
