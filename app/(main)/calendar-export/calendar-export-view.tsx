'use client';

import React, { useState, useMemo } from 'react';
import { Send, Hash, Key, MessageSquare, CalendarDays, MapPin } from 'lucide-react';
import { mockTournaments } from '@/src/data/mock-tournaments';
import { Tournament, GAME_LABELS, GAME_COLORS, FORMAT_LABELS, REGION_LABELS, GameType, FormatType, RegionType } from '@/src/types';
import { showToast } from '@/src/components/common/toast-notification';

const ALL_GAMES: GameType[] = ['tekken8','sf6','guilty_gear','marvel_tokon','multi_game','other'];
const ALL_REGIONS: RegionType[] = ['russia','belarus','kazakhstan','ukraine','cis','europe','other'];

export function CalendarExportView() {
  const [filterGame, setFilterGame] = useState<GameType | ''>('');
  const [filterFormat, setFilterFormat] = useState<FormatType | ''>('');
  const [filterRegion, setFilterRegion] = useState<RegionType | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [platform, setPlatform] = useState<'discord' | 'telegram'>('discord');

  // Discord fields
  const [discordServerId, setDiscordServerId] = useState('');
  const [discordBotToken, setDiscordBotToken] = useState('');
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [discordCreateEvents, setDiscordCreateEvents] = useState(false);

  // Telegram fields
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramFormat, setTelegramFormat] = useState<'short' | 'detailed'>('short');

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return (mockTournaments ?? []).filter((t: Tournament) => {
      if (filterGame && t?.game !== filterGame) return false;
      if (filterFormat && t?.format !== filterFormat) return false;
      if (filterRegion && t?.region !== filterRegion) return false;
      if (filterDateFrom && (t?.endDate ?? '') < filterDateFrom) return false;
      if (filterDateTo && (t?.startDate ?? '') > filterDateTo) return false;
      return true;
    });
  }, [filterGame, filterFormat, filterRegion, filterDateFrom, filterDateTo]);

  const handleExport = () => {
    const newErrors: Record<string, boolean> = {};
    if (platform === 'discord') {
      if (!discordServerId?.trim()) newErrors['discordServerId'] = true;
      if (!discordBotToken?.trim()) newErrors['discordBotToken'] = true;
      if (!discordChannelId?.trim()) newErrors['discordChannelId'] = true;
    } else {
      if (!telegramBotToken?.trim()) newErrors['telegramBotToken'] = true;
      if (!telegramChatId?.trim()) newErrors['telegramChatId'] = true;
    }
    setErrors(newErrors);
    if (Object.keys(newErrors ?? {}).length > 0) return;
    showToast(`Экспорт ${filtered?.length ?? 0} турниров в ${platform === 'discord' ? 'Discord' : 'Telegram'} выполнен успешно`, 'success');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Экспорт календаря</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Filters + Preview */}
        <div className="space-y-4">
          <div className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
            <h2 className="text-sm font-semibold mb-4">Фильтры данных</h2>
            <div className="space-y-3">
              <select value={filterGame} onChange={(e: any) => setFilterGame(e?.target?.value ?? '')} className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm">
                <option value="">Все игры</option>
                {ALL_GAMES.map((g: GameType) => <option key={g} value={g}>{GAME_LABELS[g]}</option>)}
              </select>
              <select value={filterFormat} onChange={(e: any) => setFilterFormat(e?.target?.value ?? '')} className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm">
                <option value="">Все форматы</option>
                <option value="online">Онлайн</option>
                <option value="offline">Офлайн</option>
              </select>
              <select value={filterRegion} onChange={(e: any) => setFilterRegion(e?.target?.value ?? '')} className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm">
                <option value="">Все регионы</option>
                {ALL_REGIONS.map((r: RegionType) => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
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
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Channel ID *</label>
                <div className={`flex items-center bg-white/5 rounded-lg border px-3 py-2 gap-2 ${errors?.['discordChannelId'] ? 'border-red-500' : 'border-border/50'}`}>
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <input type="text" value={discordChannelId} onChange={(e: any) => { setDiscordChannelId(e?.target?.value ?? ''); setErrors((p: any) => ({...(p ?? {}), discordChannelId: false})); }} className="bg-transparent text-sm outline-none flex-1" placeholder="Channel ID" />
                </div>
                {errors?.['discordChannelId'] && <span className="text-xs text-red-500 mt-1">Обязательное поле</span>}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={discordCreateEvents} onChange={(e: any) => setDiscordCreateEvents(e?.target?.checked ?? false)} className="rounded border-border" />
                Создавать Discord Events
              </label>
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
          <button onClick={handleExport} className={`w-full mt-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            platform === 'discord' ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white' : 'bg-[#229ED9] hover:bg-[#1A8BC5] text-white'
          }`}>
            <Send className="w-4 h-4" />
            {platform === 'discord' ? 'Экспортировать в Discord' : 'Отправить в Telegram'}
          </button>
        </div>
      </div>
    </div>
  );
}
