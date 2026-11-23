import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export const LEGEND_VOTE_ROUND_SETTING_KEY = 'legend_vote_active_round';
export const LEGEND_ROUND_COUNT = 24;

export const LEGEND_VOTE_ROLE_LABELS: Record<string, string> = {
  player: 'Игрок',
  organizer: 'Турнирный организатор',
  content_maker: 'Контент-мейкер',
};

export async function getActiveLegendVoteRound(): Promise<number> {
  const setting = await prisma.appSetting.upsert({
    where: { key: LEGEND_VOTE_ROUND_SETTING_KEY },
    update: {},
    create: { key: LEGEND_VOTE_ROUND_SETTING_KEY, value: '1' },
  });
  const round = Number.parseInt(setting.value, 10);
  return Number.isInteger(round) && round >= 1 && round <= LEGEND_ROUND_COUNT ? round : 1;
}

export interface LegendVoteDateFilters {
  legendNumber?: number;
  from?: Date;
  toExclusive?: Date;
}

export function parseLegendVoteFilters(params: URLSearchParams): { filters?: LegendVoteDateFilters; error?: string } {
  const filters: LegendVoteDateFilters = {};
  const legendNumberValue = params.get('legendNumber')?.trim();
  if (legendNumberValue) {
    if (!/^\d+$/.test(legendNumberValue)) return { error: 'Номер легенды должен быть целым числом' };
    const legendNumber = Number(legendNumberValue);
    if (legendNumber < 1 || legendNumber > LEGEND_ROUND_COUNT) return { error: `Номер легенды должен быть от 1 до ${LEGEND_ROUND_COUNT}` };
    filters.legendNumber = legendNumber;
  }

  const fromValue = params.get('from')?.trim();
  const toValue = params.get('to')?.trim();
  const parseDate = (value: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  };

  if (fromValue) {
    const from = parseDate(fromValue);
    if (!from) return { error: 'Некорректная дата начала периода' };
    filters.from = from;
  }
  if (toValue) {
    const to = parseDate(toValue);
    if (!to) return { error: 'Некорректная дата окончания периода' };
    filters.toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  }
  if (filters.from && filters.toExclusive && filters.from >= filters.toExclusive) {
    return { error: 'Дата начала периода должна быть не позже даты окончания' };
  }

  return { filters };
}

export function legendVoteWhere(filters: LegendVoteDateFilters): Prisma.LegendVoteWhereInput {
  return {
    ...(filters.legendNumber ? { legendNumber: filters.legendNumber } : {}),
    ...(filters.from || filters.toExclusive
      ? { createdAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.toExclusive ? { lt: filters.toExclusive } : {}) } }
      : {}),
  };
}
