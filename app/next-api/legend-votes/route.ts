import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { getLegendVoteState, LEGEND_VOTE_ROLE_LABELS } from '@/lib/legend-votes';

export const dynamic = 'force-dynamic';

const ALLOWED_NICKNAME = /^[\p{L}\p{N}_ -]+$/u;

export async function GET() {
  const { session, error } = await requireRole(['admin', 'moderator', 'user']);
  if (error) return error;

  const state = await getLegendVoteState();
  const legendNumber = state.legendNumber;
  const vote = await prisma.legendVote.findUnique({
    where: { userId_legendNumber: { userId: session!.user.id, legendNumber } },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ legendNumber, status: state.status, deadlineAt: state.deadlineAt, hasVoted: !!vote, votedAt: vote?.createdAt ?? null });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(['admin', 'moderator', 'user']);
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Проверьте заполнение формы' }, { status: 400 });
  }

  const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : '';
  const role = typeof body?.role === 'string' ? body.role : '';
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
  const requestedLegendNumber = Number(body?.legendNumber);

  if (!nickname || nickname.length > 64 || !ALLOWED_NICKNAME.test(nickname)) {
    return NextResponse.json({ error: 'Никнейм: только буквы, цифры, дефис, подчёркивание и пробел (до 64 символов)' }, { status: 400 });
  }
  if (!Object.prototype.hasOwnProperty.call(LEGEND_VOTE_ROLE_LABELS, role)) {
    return NextResponse.json({ error: 'Выберите роль кандидата из списка' }, { status: 400 });
  }
  if (!comment || comment.length > 5000) {
    return NextResponse.json({ error: 'Напишите комментарий (до 5000 символов)' }, { status: 400 });
  }

  const state = await getLegendVoteState();
  const legendNumber = state.legendNumber;
  if (state.status !== 'open') return NextResponse.json({ error: 'Голосование за эту легенду завершено' }, { status: 409 });
  if (!Number.isInteger(requestedLegendNumber) || requestedLegendNumber !== legendNumber) {
    return NextResponse.json({ error: 'Раунд голосования изменился. Закройте окно и откройте его заново.' }, { status: 409 });
  }

  const user = await prisma.user.findUnique({ where: { id: session!.user.id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Не удалось подтвердить пользователя' }, { status: 401 });

  try {
    const vote = await prisma.legendVote.create({
      data: { userId: user.id, legendNumber, nickname, role, comment },
      select: { id: true, legendNumber: true, createdAt: true },
    });
    return NextResponse.json({ success: true, vote }, { status: 201 });
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002') {
      return NextResponse.json({ error: `Вы уже проголосовали за легенду №${legendNumber}` }, { status: 409 });
    }
    throw cause;
  }
}
