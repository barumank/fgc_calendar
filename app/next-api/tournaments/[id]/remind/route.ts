import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { getScheduledStart } from '@/lib/discord';

export const dynamic = 'force-dynamic';

const OFFSET_MS: Record<string, number> = { hour: 60 * 60 * 1000, day: 24 * 60 * 60 * 1000 };

function formatTournamentStart(startDate: string, startTime?: string | null) {
  const [y, m, d] = startDate.split('-');
  const datePart = `${d}.${m}.${y}`;
  return startTime ? `${datePart}, ${startTime}` : datePart;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(['admin', 'moderator', 'user']);
  if (error) return error;

  const body = await req.json();
  const offset = body?.offset;
  if (offset !== 'hour' && offset !== 'day') {
    return NextResponse.json({ error: 'Некорректный параметр' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user?.tournamentTelegramChatId) {
    return NextResponse.json(
      { error: 'Сначала укажите Chat ID в блоке «Подписка на турниры» в разделе «Уведомления»' },
      { status: 400 },
    );
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 });
  }

  const startMs = getScheduledStart(tournament.startDate, tournament.startTime).getTime();
  if (Number.isNaN(startMs)) {
    return NextResponse.json({ error: 'У турнира не указана корректная дата начала' }, { status: 400 });
  }

  const fireAt = startMs - OFFSET_MS[offset];
  if (fireAt <= Date.now()) {
    return NextResponse.json({ error: 'До начала турнира осталось меньше выбранного интервала' }, { status: 400 });
  }

  const existing = await prisma.tournamentReminder.findUnique({
    where: { tournamentId_userId_offset: { tournamentId: tournament.id, userId: user.id, offset } },
  });
  if (existing && !existing.sent) {
    return NextResponse.json({ error: 'Вы уже подписаны на это уведомление по этому турниру' }, { status: 409 });
  }

  await prisma.tournamentReminder.upsert({
    where: { tournamentId_userId_offset: { tournamentId: tournament.id, userId: user.id, offset } },
    update: { sent: false },
    create: { tournamentId: tournament.id, userId: user.id, offset },
  });

  await prisma.subscriptionLog.create({
    data: {
      userEmail: user.email,
      tournamentName: tournament.name,
      offset,
      tournamentStartAt: formatTournamentStart(tournament.startDate, tournament.startTime),
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
