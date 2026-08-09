import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;
const VALID_PLATFORMS = ['discord', 'telegram', 'google', 'yandex'];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
