import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const tournaments = await prisma.tournament.findMany({
    where: { requestId: params.id },
    select: { id: true, name: true, sourceUrl: true, playersCount: true, resultsFetchedAt: true, featured: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(tournaments);
}
