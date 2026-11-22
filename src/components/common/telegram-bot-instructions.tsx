'use client';

import React from 'react';
import useSWR from 'swr';
import { getTelegramBotUrl } from '@/src/lib/telegram-links';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TelegramBotInstructions() {
  const { data: botSettings } = useSWR<{ botName: string; hasToken: boolean }>('/next-api/admin/settings/telegram', fetcher);
  const botUrl = getTelegramBotUrl(botSettings?.botName);
  return (
    <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
      Зайдите в Telegram с того аккаунта, на который вы бы хотели получать уведомления. Затем найдите в поиске нашего бота
      {botSettings?.botName && botUrl ? (
        <> (<a href={botUrl} target="_blank" rel="noopener noreferrer" className="text-[#229ED9] font-medium hover:underline">@{botSettings.botName.replace(/^@+/, '')}</a>)</>
      ) : ''}.
      Напишите этому боту или нажмите "/start". В ответ бот вам сообщит ваш Chat ID — этот id укажите в разделе ниже.
    </div>
  );
}
