import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.backlogItem.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
  }

  const body = await req.json();
  const status = body?.status;
  if (status !== 'pending' && status !== 'done') {
    return NextResponse.json({ error: 'Некорректный статус' }, { status: 400 });
  }

  const item = await prisma.backlogItem.update({ where: { id: params.id }, data: { status } });
  return NextResponse.json(item);
}
