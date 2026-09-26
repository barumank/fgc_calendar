import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const featured = !!body?.featured;

  const tournaments = await prisma.tournament.findMany({ where: { requestId: params.id }, select: { id: true } });
  if (tournaments.length === 0) {
    return NextResponse.json({ error: 'У этой заявки нет турниров' }, { status: 404 });
  }

  if (featured) {
    // Only one event can be featured at a time — clear it everywhere else
    // first, then mark every tournament this request produced (so a
    // multi-discipline start.gg import is featured as a whole event).
    await prisma.$transaction([
      prisma.tournament.updateMany({ where: { featured: true }, data: { featured: false } }),
      prisma.tournament.updateMany({ where: { requestId: params.id }, data: { featured: true } }),
    ]);
  } else {
    await prisma.tournament.updateMany({ where: { requestId: params.id }, data: { featured: false } });
  }

  return NextResponse.json({ ok: true, featured });
}
