import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CHALLONGE_MONTHLY_LIMIT, currentUsageMonth } from '@/lib/challonge';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const month = currentUsageMonth();
  const usage = await prisma.challongeApiUsage.findUnique({ where: { month } });
  return NextResponse.json({ month, count: usage?.count ?? 0, limit: CHALLONGE_MONTHLY_LIMIT });
}
