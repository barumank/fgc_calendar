import { prisma } from '@/lib/db';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { sendTelegramMessage } from '@/lib/telegram';
import { getScheduledStart } from '@/lib/discord';

const CHECK_INTERVAL_MS = 60 * 1000;
const OFFSET_MS: Record<string, number> = { hour: 60 * 60 * 1000, day: 24 * 60 * 60 * 1000 };
const OFFSET_LABEL: Record<string, string> = { hour: 'через 1 час', day: 'через 24 часа' };

let started = false;

export function startReminderScheduler() {
  if (started) return;
  started = true;
  console.log('[tournament-reminders] scheduler started, checking every 60s');
  setInterval(() => {
    checkDueReminders().catch((e) => console.error('[tournament-reminders] check failed', e));
  }, CHECK_INTERVAL_MS);
}

async function checkDueReminders() {
  const pending = await prisma.tournamentReminder.findMany({ where: { sent: false } });
  if (pending.length === 0) return;

  const botToken = await getSetting(SETTING_KEYS.telegramBotToken);
  if (!botToken) return;

  const tournamentIds = [...new Set(pending.map((r) => r.tournamentId))];
  const userIds = [...new Set(pending.map((r) => r.userId))];
  const [tournaments, users] = await Promise.all([
    prisma.tournament.findMany({ where: { id: { in: tournamentIds } } }),
    prisma.user.findMany({ where: { id: { in: userIds } } }),
  ]);
  const tournamentById = new Map(tournaments.map((t) => [t.id, t]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const now = Date.now();

  for (const reminder of pending) {
    const tournament = tournamentById.get(reminder.tournamentId);
    const user = userById.get(reminder.userId);

    // Tournament removed or user unlinked their chat id since subscribing — nothing to send, stop tracking it.
    if (!tournament || !user?.tournamentTelegramChatId) {
      await prisma.tournamentReminder.delete({ where: { id: reminder.id } }).catch(() => {});
      continue;
    }

    const startMs = getScheduledStart(tournament.startDate, tournament.startTime).getTime();
    if (Number.isNaN(startMs) || now >= startMs) {
      await prisma.tournamentReminder.update({ where: { id: reminder.id }, data: { sent: true } }).catch(() => {});
      continue;
    }

    const fireAt = startMs - (OFFSET_MS[reminder.offset] ?? 0);
    if (now < fireAt) continue;

    const text = [
      `⏰ Турнир «${tournament.name}» начнётся ${OFFSET_LABEL[reminder.offset] ?? 'скоро'}`,
      `Дата: ${tournament.startDate}${tournament.startTime ? `, ${tournament.startTime}` : ''}`,
    ].join('\n');

    try {
      await sendTelegramMessage(botToken, user.tournamentTelegramChatId, text);
      await prisma.tournamentReminder.update({ where: { id: reminder.id }, data: { sent: true } });
    } catch (e) {
      console.error('[tournament-reminders] failed to send', e);
    }
  }
}
