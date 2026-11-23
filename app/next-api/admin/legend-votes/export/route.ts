import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { LEGEND_VOTE_ROLE_LABELS, legendVoteWhere, parseLegendVoteFilters } from '@/lib/legend-votes';

export const dynamic = 'force-dynamic';

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const { filters, error: filterError } = parseLegendVoteFilters(req.nextUrl.searchParams);
  if (filterError) return NextResponse.json({ error: filterError }, { status: 400 });

  const votes = await prisma.legendVote.findMany({
    where: legendVoteWhere(filters!),
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const rows = [
    ['Логин пользователя', 'Дата голосования (UTC)', 'Номер легенды', 'Никнейм кандидата', 'Роль', 'Комментарий'],
    ...votes.map((vote) => [
      vote.user.email,
      vote.createdAt.toISOString(),
      String(vote.legendNumber),
      vote.nickname,
      LEGEND_VOTE_ROLE_LABELS[vote.role] ?? vote.role,
      vote.comment,
    ]),
  ];
  const csv = `\uFEFFsep=;\r\n${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="legend-votes.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
