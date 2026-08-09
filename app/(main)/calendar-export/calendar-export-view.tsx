'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Send, Hash, Key, CalendarDays, MapPin } from 'lucide-react';
import { Tournament, FORMAT_LABELS, REGION_LABELS, GameType, FormatType, RegionType } from '@/src/types';
import { showToast } from '@/src/components/common/toast-notification';
import { useGames } from '@/src/hooks/use-games';
import { HeaderActions } from '@/src/components/layout/header-actions';

const ALL_REGIONS: RegionType[] = ['russia','belarus','kazakhstan','ukraine','cis','europe','other'];
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CalendarExportView() {
  const { gameKeys: ALL_GAMES, labels: GAME_LABELS, colors: GAME_COLORS } = useGames();
  const { data: tournaments } = useSWR<Tournament[]>('/next-api/tournaments', fetcher);
  const [filterGames, setFilterGames] = useState<GameType[]>([]);
  const [filterFormat, setFilterFormat] = useState<FormatType | ''>('');
  const [filterRegion, setFilterRegion] = useState<RegionType | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [platform, setPlatform] = useState<'discord' | 'telegram'>('discord');

  // Discord fields
  const [discordServerId, setDiscordServerId] = useState('');
  const [discordBotToken, setDiscordBotToken] = useState('');
  const [discordExporting, setDiscordExporting] = useState(false);

  // Telegram fields
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramFormat, setTelegramFormat] = useState<'short' | 'detailed'>('short');

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const toggleFilterGame = (g: GameType) => setFilterGames((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const filtered = useMemo(() => {
    return (tournaments ?? []).filter((t: Tournament) => {
      if (filterGames.length > 0 && !filterGames.includes(t?.game)) return false;
      if (filterFormat && t?.format !== filterFormat) return false;
      if (filterRegion && t?.region !== filterRegion) return false;
      if (filterDateFrom && (t?.endDate ?? '') < filterDateFrom) return false;
      if (filterDateTo && (t?.startDate ?? '') > filterDateTo) return false;
      return true;
    });
  }, [tournaments, filterGames, filterFormat, filterRegion, filterDateFrom, filterDateTo]);

  const handleDiscordExport = async () => {
    if (discordExporting) return;
    const newErrors: Record<string, boolean> = {};
    if (!discordServerId?.trim()) newErrors['discordServerId'] = true;
    if (!discordBotToken?.trim()) newErrors['discordBotToken'] = true;
    setErrors(newErrors);
    if (Object.keys(newErrors ?? {}).length > 0) return;
    if ((filtered?.length ?? 0) === 0) {
      showToast('Нет турниров, подходящих под фильтры', 'error');
      return;
    }

    setDiscordExporting(true);
    try {
      const res = await fetch('/next-api/export/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: discordServerId.trim(),
          botToken: discordBotToken.trim(),
          tournamentIds: filtered.map((t) => t.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось экспортировать в Discord', 'error');
        return;
      }
      const created = data.results.filter((r: any) => r.status === 'created').length;
      const skipped = data.results.filter((r: any) => r.status === 'skipped').length;
      const errors = data.results.filter((r: any) => r.status === 'error');
      const parts = [`Создано событий: ${created}`];
      if (skipped > 0) parts.push(`пропущено: ${skipped}`);
      if (errors.length > 0) {
        parts.push(`ошибок: ${errors.length}`);
        const details = errors.slice(0, 2).map((r: any) => `«${r.name}»: ${r.error}`).join('; ');
        showToast(`${parts.join(', ')}. ${details}`, 'error');
      } else {
        showToast(parts.join(', '), 'success');
      }
    } catch {
      showToast('Не удалось экспортировать в Discord', 'error');
    } finally {
      setDiscordExporting(false);
    }
  };

  const handleTelegramExport = () => {
    const newErrors: Record<string, boolean> = {};
    if (!telegramBotToken?.trim()) newErrors['telegramBotToken'] = true;
    if (!telegramChatId?.trim()) newErrors['telegramChatId'] = true;
    setErrors(newErrors);
    if (Object.keys(newErrors ?? {}).length > 0) return;
    showToast(`Экспорт ${filtered?.length ?? 0} турниров в Telegram выполнен успешно`, 'success');
  };

  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Filters + Preview */}
        <div className="space-y-4">
          <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
            <h2 className="text-sm font-semibold mb-4">Фильтры данных</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Дисциплины</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_GAMES.map((g: GameType) => (
                    <button key={g} onClick={() => toggleFilterGame(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterGames.includes(g) ? 'text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                      style={filterGames.includes(g) ? { backgroundColor: GAME_COLORS[g] } : {}}>
                      {GAME_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>
              <select value={filterFormat} onChange={(e: any) => setFilterFormat(e?.target?.value ?? '')} className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm">
                <option value="" className="bg-[#1A1A2E] text-foreground">Все форматы</option>
                <option value="online" className="bg-[#1A1A2E] text-foreground">Онлайн</option>
                <option value="offline" className="bg-[#1A1A2E] text-foreground">Офлайн</option>
              </select>
              <select value={filterRegion} onChange={(e: any) => setFilterRegion(e?.target?.value ?? '')} className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm">
                <option value="" className="bg-[#1A1A2E] text-foreground">Все регионы</option>
                {ALL_REGIONS.map((r: RegionType) => <option key={r} value={r} className="bg-[#1A1A2E] text-foreground">{REGION_LABELS[r]}</option>)}
              </select>
              <div className="flex gap-3">
                <input type="date" value={filterDateFrom} onChange={(e: any) => setFilterDateFrom(e?.target?.value ?? '')} className="flex-1 bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm" />
                <input type="date" value={filterDateTo} onChange={(e: any) => setFilterDateTo(e?.target?.value ?? '')} className="flex-1 bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
            <h2 className="text-sm font-semibold mb-3">Предпросмотр ({filtered?.length ?? 0} турниров)</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {(filtered ?? []).map((t: Tournament) => (
                <div key={t?.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: GAME_COLORS[t?.game] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t?.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="w-3 h-3" />{t?.startDate}
                      <MapPin className="w-3 h-3 ml-1" />{t?.city}
                      {t?.discordEventId && <span className="text-[10px] text-green-400 ml-1">уже в Discord</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Platform Config */}
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
          <div className="flex gap-2 mb-5">
            <button onClick={() => setPlatform('discord')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${platform === 'discord' ? 'bg-[#5865F2] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Discord</button>
            <button onClick={() => setPlatform('telegram')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${platform === 'telegram' ? 'bg-[#229ED9] text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Telegram</button>
          </div>
          {platform === 'discord' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Server ID *</label>
                <div className={`flex items-center bg-white/5 rounded-lg border px-3 py-2 gap-2 ${errors?.['discordServerId'] ? 'border-red-500' : 'border-border/50'}`}>
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <input type="text" value={discordServerId} onChange={(e: any) => { setDiscordServerId(e?.target?.value ?? ''); setErrors((p: any) => ({...(p ?? {}), discordServerId: false})); }} className="bg-transparent text-sm outline-none flex-1" placeholder="123456789" />
                </div>
                {errors?.['discordServerId'] && <span className="text-xs text-red-500 mt-1">Обязательное поле</span>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bot Token *</label>
                <div className={`flex items-center bg-white/5 rounded-lg border px-3 py-2 gap-2 ${errors?.['discordBotToken'] ? 'border-red-500' : 'border-border/50'}`}>
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <input type="password" value={discordBotToken} onChange={(e: any) => { setDiscordBotToken(e?.target?.value ?? ''); setErrors((p: any) => ({...(p ?? {}), discordBotToken: false})); }} className="bg-transparent text-sm outline-none flex-1" placeholder="Bot token" />
                </div>
                {errors?.['discordBotToken'] && <span className="text-xs text-red-500 mt-1">Обязательное поле</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                Для каждого турнира из предпросмотра создаётся отдельное событие ("Событие сервера") в выбранном Discord-сервере. Турниры, уже выгруженные ранее, пропускаются повторно.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bot Token *</label>
                <div className={`flex items-center bg-white/5 rounded-lg border px-3 py-2 gap-2 ${errors?.['telegramBotToken'] ? 'border-red-500' : 'border-border/50'}`}>
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <input type="password" value={telegramBotToken} onChange={(e: any) => { setTelegramBotToken(e?.target?.value ?? ''); setErrors((p: any) => ({...(p ?? {}), telegramBotToken: false})); }} className="bg-transparent text-sm outline-none flex-1" placeholder="Bot token" />
                </div>
                {errors?.['telegramBotToken'] && <span className="text-xs text-red-500 mt-1">Обязательное поле</span>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Chat ID *</label>
                <div className={`flex items-center bg-white/5 rounded-lg border px-3 py-2 gap-2 ${errors?.['telegramChatId'] ? 'border-red-500' : 'border-border/50'}`}>
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <input type="text" value={telegramChatId} onChange={(e: any) => { setTelegramChatId(e?.target?.value ?? ''); setErrors((p: any) => ({...(p ?? {}), telegramChatId: false})); }} className="bg-transparent text-sm outline-none flex-1" placeholder="-1001234567890" />
                </div>
                {errors?.['telegramChatId'] && <span className="text-xs text-red-500 mt-1">Обязательное поле</span>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Формат сообщения</label>
                <div className="flex gap-2">
                  <button onClick={() => setTelegramFormat('short')} className={`flex-1 py-2 rounded-lg text-sm ${telegramFormat === 'short' ? 'bg-[#229ED9] text-white' : 'bg-white/5'}`}>Краткий</button>
                  <button onClick={() => setTelegramFormat('detailed')} className={`flex-1 py-2 rounded-lg text-sm ${telegramFormat === 'detailed' ? 'bg-[#229ED9] text-white' : 'bg-white/5'}`}>Подробный</button>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={platform === 'discord' ? handleDiscordExport : handleTelegramExport}
            disabled={platform === 'discord' && discordExporting}
            className={`w-full mt-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              platform === 'discord' ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white' : 'bg-[#229ED9] hover:bg-[#1A8BC5] text-white'
            }`}>
            <Send className="w-4 h-4" />
            {platform === 'discord' ? (discordExporting ? 'Экспортируется...' : 'Экспортировать в Discord') : 'Отправить в Telegram'}
          </button>
        </div>
      </div>
    </div>
  );
}
