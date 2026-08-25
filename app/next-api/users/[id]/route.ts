import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { isRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }

  const body = await req.json();
  const data: { role?: string; name?: string | null } = {};

  if (body?.role !== undefined) {
    if (!isRole(body.role)) {
      return NextResponse.json({ error: 'Некорректная роль' }, { status: 400 });
    }
    if (existing.id === session!.user.id && body.role !== 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Нельзя понизить последнего администратора' }, { status: 400 });
      }
    }
    data.role = body.role;
  }

  if (body?.name !== undefined) {
    data.name = (body.name ?? '').trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}
