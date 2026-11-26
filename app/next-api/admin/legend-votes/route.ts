import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import {
  getLegendVoteState,
  LEGEND_ROUND_COUNT,
  LEGEND_VOTE_DEADLINE_SETTING_KEY,
  LEGEND_VOTE_ROLE_LABELS,
  LEGEND_VOTE_ROUND_SETTING_KEY,
  legendVoteRoundEndedAtKey,
  legendVoteRoundStartedAtKey,
  legendVoteWhere,
  parseLegendVoteFilters,
} from '@/lib/legend-votes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const requestedCard = req.nextUrl.searchParams.get('publishedCard');
  if (requestedCard) {
    const legendNumber = Number(requestedCard);
    if (!Number.isInteger(legendNumber) || legendNumber < 1 || legendNumber > LEGEND_ROUND_COUNT) return NextResponse.json({ error: 'Некорректный номер легенды' }, { status: 400 });
    const card = await prisma.legendCard.findUnique({ where: { legendNumber } });
    if (!card?.publishedAt) return NextResponse.json({ error: 'Опубликованная карточка не найдена' }, { status: 404 });
    return NextResponse.json({ card });
  }

  const { filters, error: filterError } = parseLegendVoteFilters(req.nextUrl.searchParams);
  if (filterError) return NextResponse.json({ error: filterError }, { status: 400 });

  const where = legendVoteWhere(filters!);
  const [state, votes, total, allCards, publishedCards, roundVoteStats, roundSettings] = await Promise.all([
    getLegendVoteState(),
    prisma.legendVote.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.legendVote.count({ where }),
    prisma.legendCard.findMany({ select: { legendNumber: true, displayPosition: true, nickname: true } }),
    prisma.legendCard.findMany({ where: { publishedAt: { not: null } }, orderBy: { legendNumber: 'desc' }, select: { legendNumber: true, displayPosition: true, nickname: true, nomination: true, achievement: true, comment: true, podcastUrl: true, publishedAt: true } }),
    prisma.legendVote.groupBy({ by: ['legendNumber'], _count: { _all: true }, _min: { createdAt: true }, _max: { createdAt: true } }),
    prisma.appSetting.findMany({ where: { key: { in: Array.from({ length: LEGEND_ROUND_COUNT }, (_, index) => index + 1).flatMap((number) => [legendVoteRoundStartedAtKey(number), legendVoteRoundEndedAtKey(number)]) } } }),
  ]);

  const settingValues = new Map(roundSettings.map((setting) => [setting.key, setting.value]));
  const voteStats = new Map(roundVoteStats.map((item) => [item.legendNumber, item]));

  return NextResponse.json({
    activeLegendNumber: state.legendNumber,
    nextLegendNumber: state.legendNumber < LEGEND_ROUND_COUNT ? state.legendNumber + 1 : null,
    deadlineAt: state.deadlineAt,
    startedAt: state.startedAt,
    roundStatus: state.status,
    card: state.card,
    occupiedPositions: allCards,
    publishedCards: publishedCards.map((card) => {
      const stats = voteStats.get(card.legendNumber);
      return {
        ...card,
        roundStartedAt: settingValues.get(legendVoteRoundStartedAtKey(card.legendNumber)) ?? null,
        roundEndedAt: settingValues.get(legendVoteRoundEndedAtKey(card.legendNumber)) ?? null,
        votesCount: stats?._count._all ?? 0,
        firstVoteAt: stats?._min.createdAt,
        lastVoteAt: stats?._max.createdAt,
      };
    }),
    total,
    votes: votes.map((vote) => ({
      id: vote.id,
      userLogin: vote.user.email,
      userName: vote.user.name,
      createdAt: vote.createdAt,
      legendNumber: vote.legendNumber,
      nickname: vote.nickname,
      role: vote.role,
      roleLabel: LEGEND_VOTE_ROLE_LABELS[vote.role] ?? vote.role,
      comment: vote.comment,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 }); }
  const state = await getLegendVoteState();

  if (body?.action === 'set-deadline') {
    if (state.status !== 'open') return NextResponse.json({ error: 'Срок голосования можно изменить только пока раунд открыт' }, { status: 409 });
    const deadlineAt = new Date(body.deadlineAt);
    if (Number.isNaN(deadlineAt.getTime()) || deadlineAt.getTime() <= Date.now()) return NextResponse.json({ error: 'Укажите будущие дату и время' }, { status: 400 });
    await prisma.appSetting.upsert({ where: { key: LEGEND_VOTE_DEADLINE_SETTING_KEY }, update: { value: deadlineAt.toISOString() }, create: { key: LEGEND_VOTE_DEADLINE_SETTING_KEY, value: deadlineAt.toISOString() } });
    return NextResponse.json({ deadlineAt });
  }

  if (body?.action === 'save-card') {
    if (state.status !== 'processing') return NextResponse.json({ error: 'Карточку можно подготовить после завершения голосования' }, { status: 409 });
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
    const nomination = typeof body.nomination === 'string' ? body.nomination.trim() : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    const imageData = typeof body.imageData === 'string' ? body.imageData : '';
    const displayPosition = Number(body.displayPosition);
    const podcastUrl = typeof body.podcastUrl === 'string' ? body.podcastUrl.trim() : '';
    if (!nickname || nickname.length > 80 || !nomination || nomination.length > 100 || !comment || comment.length > 3000) return NextResponse.json({ error: 'Заполните ник, номинацию и комментарий (до 3000 символов)' }, { status: 400 });
    if (!Number.isInteger(displayPosition) || displayPosition < 1 || displayPosition > LEGEND_ROUND_COUNT) return NextResponse.json({ error: `Выберите позицию от 1 до ${LEGEND_ROUND_COUNT}` }, { status: 400 });
    if (podcastUrl && (podcastUrl.length > 500 || !/^https?:\/\//i.test(podcastUrl) || !URL.canParse(podcastUrl))) return NextResponse.json({ error: 'Ссылка на подкаст должна начинаться с http:// или https://' }, { status: 400 });
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(imageData) || imageData.length > 4_500_000) return NextResponse.json({ error: 'Загрузите изображение PNG, JPG или WebP размером до 3 МБ' }, { status: 400 });
    const conflictingCard = await prisma.legendCard.findFirst({ where: { displayPosition, legendNumber: { not: state.legendNumber } }, select: { legendNumber: true } });
    if (conflictingCard) return NextResponse.json({ error: `Позиция №${displayPosition} уже назначена карточке легенды №${conflictingCard.legendNumber}` }, { status: 409 });
    try {
      const card = await prisma.legendCard.upsert({
        where: { legendNumber: state.legendNumber },
        create: { legendNumber: state.legendNumber, displayPosition, nickname, nomination, achievement: '', comment, imageData, podcastUrl: podcastUrl || null },
        update: { displayPosition, nickname, nomination, comment, imageData, podcastUrl: podcastUrl || null },
      });
      return NextResponse.json({ card });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002') return NextResponse.json({ error: `Позиция №${displayPosition} уже занята другой карточкой` }, { status: 409 });
      throw cause;
    }
  }

  if (body?.action === 'update-published-card') {
    const legendNumber = Number(body.legendNumber);
    if (!Number.isInteger(legendNumber) || legendNumber < 1 || legendNumber > LEGEND_ROUND_COUNT) return NextResponse.json({ error: 'Некорректный номер легенды' }, { status: 400 });
    const existing = await prisma.legendCard.findUnique({ where: { legendNumber } });
    if (!existing?.publishedAt) return NextResponse.json({ error: 'Опубликованная карточка не найдена' }, { status: 404 });
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
    const nomination = typeof body.nomination === 'string' ? body.nomination.trim() : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    const imageData = typeof body.imageData === 'string' ? body.imageData : '';
    const displayPosition = Number(body.displayPosition);
    const podcastUrl = typeof body.podcastUrl === 'string' ? body.podcastUrl.trim() : '';
    if (!nickname || nickname.length > 80 || !nomination || nomination.length > 100 || !comment || comment.length > 3000) return NextResponse.json({ error: 'Заполните ник, номинацию и комментарий (до 3000 символов)' }, { status: 400 });
    if (!Number.isInteger(displayPosition) || displayPosition < 1 || displayPosition > LEGEND_ROUND_COUNT) return NextResponse.json({ error: `Выберите позицию от 1 до ${LEGEND_ROUND_COUNT}` }, { status: 400 });
    if (podcastUrl && (podcastUrl.length > 500 || !/^https?:\/\//i.test(podcastUrl) || !URL.canParse(podcastUrl))) return NextResponse.json({ error: 'Ссылка на подкаст должна начинаться с http:// или https://' }, { status: 400 });
    if (!imageData || imageData === existing.imageData) {
      // Keep the existing image when the administrator changes only the text fields.
    } else if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(imageData) || imageData.length > 4_500_000) {
      return NextResponse.json({ error: 'Загрузите изображение PNG, JPG или WebP размером до 3 МБ' }, { status: 400 });
    }
    const conflictingCard = await prisma.legendCard.findFirst({ where: { displayPosition, legendNumber: { not: legendNumber } }, select: { legendNumber: true } });
    if (conflictingCard) return NextResponse.json({ error: `Позиция №${displayPosition} уже назначена карточке легенды №${conflictingCard.legendNumber}` }, { status: 409 });
    const updated = await prisma.legendCard.update({ where: { legendNumber }, data: { displayPosition, nickname, nomination, comment, imageData: imageData || existing.imageData, podcastUrl: podcastUrl || null } });
    return NextResponse.json({ card: updated });
  }

  if (body?.action === 'publish-card') {
    if (state.status !== 'processing') return NextResponse.json({ error: 'Опубликовать карточку можно после завершения голосования' }, { status: 409 });
    const card = await prisma.legendCard.findUnique({ where: { legendNumber: state.legendNumber } });
    if (!card) return NextResponse.json({ error: 'Сначала заполните и сохраните карточку легенды' }, { status: 409 });
    const published = await prisma.legendCard.update({ where: { legendNumber: state.legendNumber }, data: { publishedAt: new Date() } });
    await prisma.appSetting.upsert({ where: { key: legendVoteRoundEndedAtKey(state.legendNumber) }, update: { value: state.deadlineAt.toISOString() }, create: { key: legendVoteRoundEndedAtKey(state.legendNumber), value: state.deadlineAt.toISOString() } });
    await prisma.appSetting.upsert({ where: { key: legendVoteRoundStartedAtKey(state.legendNumber) }, update: { value: state.startedAt.toISOString() }, create: { key: legendVoteRoundStartedAtKey(state.legendNumber), value: state.startedAt.toISOString() } });
    return NextResponse.json({ card: published });
  }

  if (body?.action === 'advance-round') {
    if (state.status !== 'published') return NextResponse.json({ error: 'Сначала опубликуйте карточку текущей легенды' }, { status: 409 });
    if (state.legendNumber >= LEGEND_ROUND_COUNT) return NextResponse.json({ error: `Все ${LEGEND_ROUND_COUNT} раундов уже открыты` }, { status: 409 });
    const nextLegendNumber = state.legendNumber + 1;
    const nextStartedAt = new Date();
    const nextDeadline = new Date();
    nextDeadline.setMonth(nextDeadline.getMonth() + 1);
    await prisma.$transaction([
      prisma.appSetting.upsert({ where: { key: LEGEND_VOTE_ROUND_SETTING_KEY }, update: { value: String(nextLegendNumber) }, create: { key: LEGEND_VOTE_ROUND_SETTING_KEY, value: String(nextLegendNumber) } }),
      prisma.appSetting.upsert({ where: { key: LEGEND_VOTE_DEADLINE_SETTING_KEY }, update: { value: nextDeadline.toISOString() }, create: { key: LEGEND_VOTE_DEADLINE_SETTING_KEY, value: nextDeadline.toISOString() } }),
      prisma.appSetting.upsert({ where: { key: legendVoteRoundStartedAtKey(nextLegendNumber) }, update: { value: nextStartedAt.toISOString() }, create: { key: legendVoteRoundStartedAtKey(nextLegendNumber), value: nextStartedAt.toISOString() } }),
    ]);
    return NextResponse.json({ activeLegendNumber: nextLegendNumber, deadlineAt: nextDeadline });
  }

  return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
}
