import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;
const VALID_PLATFORMS = ['discord', 'telegram', 'google', 'yandex'];

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') ?? 'discord';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Некорректная платформа' }, { status: 400 });
  }

  const where = { platform };
  const [items, total] = await Promise.all([
    prisma.exportLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.exportLog.count({ where }),
  ]);

  return NextResponse.json({ items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
}
