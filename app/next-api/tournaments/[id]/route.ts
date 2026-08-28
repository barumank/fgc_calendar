import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 });
  }
  return NextResponse.json(tournament);
}
