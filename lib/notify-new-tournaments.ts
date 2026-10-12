import { prisma } from '@/lib/db';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { sendTelegramMessage } from '@/lib/telegram';
import { getScheduledStart } from '@/lib/discord';
import { formatDate } from '@/src/lib/format-date';

export interface NewTournamentInfo {
  id: string;
  name: string;
  game: string;
  startDate: string;
  startTime: string | null;
}

// Telegram allows ~30 messages/second overall and ~1/second per chat.
const SEND_DELAY_MS = 350;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Best-effort, like notifyNewRequestSubscribers: call it fire-and-forget
// (`.catch(() => {})`) after the tournaments are created.
export async function notifyNewTournaments(tournaments: NewTournamentInfo[]): Promise<void> {
  // Importing an already-finished event (e.g. just to collect results)
  // shouldn't announce it as a new tournament.
  const now = Date.now();
  const upcoming = tournaments.filter((t) => getScheduledStart(t.startDate, t.startTime).getTime() > now);
  if (upcoming.length === 0) return;

  const botToken = await getSetting(SETTING_KEYS.telegramBotToken);
  if (!botToken) return;

  const gameKeys = [...new Set(upcoming.map((t) => t.game))];
  const subscriptions = await prisma.disciplineSubscription.findMany({
    where: { paused: false, gameKeys: { hasSome: gameKeys } },
  });
  if (subscriptions.length === 0) return;

  const users = await prisma.user.findMany({
    where: { id: { in: subscriptions.map((s) => s.userId) }, tournamentTelegramChatId: { not: null } },
    select: { id: true, tournamentTelegramChatId: true },
  });
  const chatIdByUserId = new Map(users.map((u) => [u.id, u.tournamentTelegramChatId as string]));

  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  let firstSend = true;

  for (const subscription of subscriptions) {
    const chatId = chatIdByUserId.get(subscription.userId);
    if (!chatId) continue;

    for (const t of upcoming) {
      if (!subscription.gameKeys.includes(t.game)) continue;

      const text = [
        `🆕 Новый турнир: «${t.name}»`,
        `Начало: ${formatDate(t.startDate)}${t.startTime ? `, ${t.startTime}` : ''}`,
        `Подробнее: ${siteUrl}/tournaments?tournament=${t.id}`,
      ].join('\n');

      if (!firstSend) await sleep(SEND_DELAY_MS);
      firstSend = false;
      try {
        await sendTelegramMessage(botToken, chatId, text);
      } catch {
        // One subscriber's bad/blocked chat shouldn't stop the rest.
      }
    }
  }
}
