import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import {
  getActiveLegendVoteRound,
  LEGEND_ROUND_COUNT,
  LEGEND_VOTE_ROLE_LABELS,
  LEGEND_VOTE_ROUND_SETTING_KEY,
  legendVoteWhere,
  parseLegendVoteFilters,
} from '@/lib/legend-votes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const { filters, error: filterError } = parseLegendVoteFilters(req.nextUrl.searchParams);
  if (filterError) return NextResponse.json({ error: filterError }, { status: 400 });

  const where = legendVoteWhere(filters!);
  const [activeLegendNumber, votes, total] = await Promise.all([
    getActiveLegendVoteRound(),
    prisma.legendVote.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.legendVote.count({ where }),
  ]);

  return NextResponse.json({
    activeLegendNumber,
    nextLegendNumber: activeLegendNumber < LEGEND_ROUND_COUNT ? activeLegendNumber + 1 : null,
    total,
    votes: votes.map((vote) => ({
      id: vote.id,
      userLogin: vote.user.email,
      userName: vote.user.name,
      createdAt: vote.createdAt,
      legendNumber: vote.legendNumber,
      nickname: vote.nickname,
      role: vote.role,
      roleLabel: LEGEND_VOTE_ROLE_LABELS[vote.role] ?? vote.role,
      comment: vote.comment,
    })),
  });
}

export async function POST() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const currentLegendNumber = await getActiveLegendVoteRound();
  if (currentLegendNumber >= LEGEND_ROUND_COUNT) {
    return NextResponse.json({ error: `Все ${LEGEND_ROUND_COUNT} раундов уже открыты` }, { status: 409 });
  }

  const nextLegendNumber = currentLegendNumber + 1;
  await prisma.appSetting.upsert({
    where: { key: LEGEND_VOTE_ROUND_SETTING_KEY },
    update: { value: String(nextLegendNumber) },
    create: { key: LEGEND_VOTE_ROUND_SETTING_KEY, value: String(nextLegendNumber) },
  });

  return NextResponse.json({ activeLegendNumber: nextLegendNumber });
}
