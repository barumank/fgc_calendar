import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { isRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json();
  const email = (body?.email ?? '').trim().toLowerCase();
  const password = body?.password ?? '';
  const name = (body?.name ?? '').trim();
  const role = body?.role;

  if (!email || !password) {
    return NextResponse.json({ error: 'Укажите email и пароль' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Пароль должен быть не короче 8 символов' }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: 'Некорректная роль' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name: name || null, role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
