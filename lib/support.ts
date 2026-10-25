import { prisma } from '@/lib/db';
import { SETTING_KEYS, getSetting } from '@/lib/app-settings';

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const TOP_LIMIT = 10;
const RECENT_LIMIT = 10;

export interface SupportMessage {
  text: string;
  amount: number;
  paidAt: string;
}

export interface TopSupporter {
  nickname: string;
  total: number;
  tips: number;
  // Newest first.
  messages: SupportMessage[];
}

export interface RecentSupporter {
  id: string;
  nickname: string;
  amount: number;
  message: string | null;
  paidAt: string;
}

export interface SupportSummary {
  goalAmount: number;
  collected: number;
  tipsCount: number;
  monthStart: string;
  donateUrl: string | null;
  developerMessage: string;
  top: TopSupporter[];
  recent: RecentSupporter[];
}

// The goal is tracked per calendar month in Moscow time (UTC+3, no DST).
export function currentMonthRangeMsk(now = new Date()): { start: Date; end: Date } {
  const msk = new Date(now.getTime() + MSK_OFFSET_MS);
  const year = msk.getUTCFullYear();
  const month = msk.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1) - MSK_OFFSET_MS),
    end: new Date(Date.UTC(year, month + 1, 1) - MSK_OFFSET_MS),
  };
}

export async function getSupportSettings() {
  const [goal, donateUrl, developerMessage] = await Promise.all([
    getSetting(SETTING_KEYS.supportGoalAmount),
    getSetting(SETTING_KEYS.supportDonateUrl),
    getSetting(SETTING_KEYS.supportDeveloperMessage),
  ]);
  const goalAmount = Number.parseInt(goal ?? '', 10);
  return {
    goalAmount: Number.isFinite(goalAmount) && goalAmount > 0 ? goalAmount : 0,
    donateUrl: donateUrl || null,
    developerMessage: developerMessage ?? '',
  };
}

export async function getSupportSummary(now = new Date()): Promise<SupportSummary> {
  const { start, end } = currentMonthRangeMsk(now);
  const [settings, donations] = await Promise.all([
    getSupportSettings(),
    prisma.donation.findMany({ where: { hidden: false }, orderBy: { paidAt: 'desc' } }),
  ]);

  const monthly = donations.filter((d) => d.paidAt >= start && d.paidAt < end);

  // Donations arrive newest first, so the first nickname spelling seen for a
  // person is their most recent one.
  const byPerson = new Map<string, TopSupporter>();
  for (const d of donations) {
    const key = d.nickname.trim().toLowerCase();
    let entry = byPerson.get(key);
    if (!entry) {
      entry = { nickname: d.nickname, total: 0, tips: 0, messages: [] };
      byPerson.set(key, entry);
    }
    entry.total += d.amount;
    entry.tips += 1;
    if (d.message) entry.messages.push({ text: d.message, amount: d.amount, paidAt: d.paidAt.toISOString() });
  }
  const top = [...byPerson.values()]
    .sort((a, b) => b.total - a.total || b.tips - a.tips)
    .slice(0, TOP_LIMIT);

  return {
    goalAmount: settings.goalAmount,
    collected: monthly.reduce((sum, d) => sum + d.amount, 0),
    tipsCount: monthly.length,
    monthStart: start.toISOString(),
    donateUrl: settings.donateUrl,
    developerMessage: settings.developerMessage,
    top,
    recent: donations.slice(0, RECENT_LIMIT).map((d) => ({
      id: d.id,
      nickname: d.nickname,
      amount: d.amount,
      message: d.message,
      paidAt: d.paidAt.toISOString(),
    })),
  };
}
