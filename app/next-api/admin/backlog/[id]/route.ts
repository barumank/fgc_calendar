import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
