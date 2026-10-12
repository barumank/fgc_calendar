'use client';

import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TelegramBotInstructions() {
  const { data: botSettings } = useSWR<{ botName: string; hasToken: boolean }>('/next-api/admin/settings/telegram', fetcher);
  return (
    <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
      Зайдите в Telegram с того аккаунта, на который вы бы хотели получать уведомления. Затем найдите в поиске нашего бота
      {botSettings?.botName ? <> (<span className="text-[#229ED9] font-medium">@{botSettings.botName.replace(/^@/, '')}</span>)</> : ''}.
      Напишите этому боту или нажмите "/start". В ответ бот вам сообщит ваш Chat ID — этот id укажите в разделе ниже.
    </div>
  );
}
