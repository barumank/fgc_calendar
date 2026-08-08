import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { slugifyKey } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const label = (body?.label ?? '').trim();
  const shortLabel = (body?.shortLabel ?? '').trim();
  const color = (body?.color ?? '').trim();
  if (!label || !color) {
    return NextResponse.json({ error: 'Название и цвет обязательны' }, { status: 400 });
  }

  const baseKey = slugifyKey(label);
  let key = baseKey;
  let suffix = 2;
  while (await prisma.game.findUnique({ where: { key } })) {
    key = `${baseKey}_${suffix}`;
    suffix += 1;
  }

  const maxOrder = await prisma.game.aggregate({ _max: { order: true } });
  const game = await prisma.game.create({
    data: { key, label, shortLabel: shortLabel || null, color, order: (maxOrder._max.order ?? -1) + 1 },
  });

  return NextResponse.json(game, { status: 201 });
}
