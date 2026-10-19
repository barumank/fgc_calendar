import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { parseLeagueInput } from '@/lib/league-input';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.league.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Лига не найдена' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = await parseLeagueInput(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const league = await prisma.league.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(league);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.league.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Лига не найдена' }, { status: 404 });
  }

  await prisma.league.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
