import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CHALLONGE_MONTHLY_LIMIT, currentUsageMonth } from '@/lib/challonge';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const month = currentUsageMonth();
  const usage = await prisma.challongeApiUsage.findUnique({ where: { month } });
  return NextResponse.json({ month, count: usage?.count ?? 0, limit: CHALLONGE_MONTHLY_LIMIT });
}
