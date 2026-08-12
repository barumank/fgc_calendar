import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { slugifyKey } from '@/lib/slug';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

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
