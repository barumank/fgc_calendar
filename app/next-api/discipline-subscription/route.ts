import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { session, error } = await requireRole(['admin', 'moderator', 'user']);
  if (error) return error;

  const subscription = await prisma.disciplineSubscription.findUnique({ where: { userId: session!.user.id } });
  return NextResponse.json({
    gameKeys: subscription?.gameKeys ?? [],
    paused: subscription?.paused ?? false,
  });
}

// body: { gameKeys?: string[], paused?: boolean } — either or both. Saving an
// empty gameKeys list removes the subscription entirely.
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(['admin', 'moderator', 'user']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const userId = session!.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }

  const existing = await prisma.disciplineSubscription.findUnique({ where: { userId } });
  let gameKeys = existing?.gameKeys ?? [];
  let paused = existing?.paused ?? false;

  if (Array.isArray(body?.gameKeys)) {
    const requested = [...new Set(body.gameKeys.filter((k: unknown): k is string => typeof k === 'string'))] as string[];
    const validGames = requested.length
      ? await prisma.game.findMany({ where: { key: { in: requested } }, select: { key: true } })
      : [];
    gameKeys = validGames.map((g) => g.key);
  }
  if (typeof body?.paused === 'boolean') {
    paused = body.paused;
  }

  if (gameKeys.length === 0) {
    await prisma.disciplineSubscription.deleteMany({ where: { userId } });
    return NextResponse.json({ gameKeys: [], paused: false });
  }

  if (!user.tournamentTelegramChatId) {
    return NextResponse.json({ error: 'Сначала привяжите Telegram — укажите Chat ID' }, { status: 400 });
  }

  const subscription = await prisma.disciplineSubscription.upsert({
    where: { userId },
    update: { gameKeys, paused },
    create: { userId, gameKeys, paused },
  });

  return NextResponse.json({ gameKeys: subscription.gameKeys, paused: subscription.paused });
}
