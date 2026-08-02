import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CHALLONGE_MONTHLY_LIMIT, currentUsageMonth } from '@/lib/challonge';

export const dynamic = 'force-dynamic';

export async function GET() {
  const month = currentUsageMonth();
  const usage = await prisma.challongeApiUsage.findUnique({ where: { month } });
  return NextResponse.json({ month, count: usage?.count ?? 0, limit: CHALLONGE_MONTHLY_LIMIT });
}
