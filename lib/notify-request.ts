import { prisma } from '@/lib/db';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { sendTelegramMessage } from '@/lib/telegram';
import { REGION_LABELS, FORMAT_LABELS, RegionType, FormatType } from '@/src/types';
import type { TournamentRequest } from '@prisma/client';

export async function notifyNewRequestSubscribers(request: TournamentRequest): Promise<void> {
  const botToken = await getSetting(SETTING_KEYS.telegramBotToken);
  if (!botToken) return;

  const subscribers = await prisma.user.findMany({
    where: { notifyOnRequests: true, telegramChatId: { not: null } },
  });
  if (subscribers.length === 0) return;

  const game = await prisma.game.findUnique({ where: { key: request.game } });
  const gameLabel = game?.label ?? request.game;
  const regionLabel = REGION_LABELS[request.region as RegionType] ?? request.region;
  const formatLabel = FORMAT_LABELS[request.format as FormatType] ?? request.format;
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const createdAtLabel = new Date(request.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const text = [
    '🆕 Новая заявка на турнир',
    `Название: ${request.name}`,
    `Создана: ${createdAtLabel}`,
    `Дата: ${request.startDate} — ${request.endDate}`,
    `Дисциплина: ${gameLabel}`,
    `Регион: ${regionLabel}`,
    `Формат: ${formatLabel}`,
    '',
    `Посмотреть: ${siteUrl}/admin/requests`,
  ].join('\n');

  for (const user of subscribers) {
    if (!user.telegramChatId) continue;
    try {
      await sendTelegramMessage(botToken, user.telegramChatId, text);
    } catch {
      // Best-effort: one subscriber's bad chat id shouldn't block the rest.
    }
  }
}
