import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import {
  getLegendVoteState,
  LEGEND_ROUND_COUNT,
  LEGEND_VOTE_DEADLINE_SETTING_KEY,
  LEGEND_VOTE_ROLE_LABELS,
  LEGEND_VOTE_ROUND_SETTING_KEY,
  legendVoteWhere,
  parseLegendVoteFilters,
} from '@/lib/legend-votes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const { filters, error: filterError } = parseLegendVoteFilters(req.nextUrl.searchParams);
  if (filterError) return NextResponse.json({ error: filterError }, { status: 400 });

  const where = legendVoteWhere(filters!);
  const [state, votes, total] = await Promise.all([
    getLegendVoteState(),
    prisma.legendVote.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.legendVote.count({ where }),
  ]);

  return NextResponse.json({
    activeLegendNumber: state.legendNumber,
    nextLegendNumber: state.legendNumber < LEGEND_ROUND_COUNT ? state.legendNumber + 1 : null,
    deadlineAt: state.deadlineAt,
    roundStatus: state.status,
    card: state.card,
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
    const discipline = typeof body.discipline === 'string' ? body.discipline.trim() : '';
    const achievement = typeof body.achievement === 'string' ? body.achievement.trim() : '';
    const imageData = typeof body.imageData === 'string' ? body.imageData : '';
    if (!nickname || nickname.length > 80 || !discipline || discipline.length > 100 || !achievement || achievement.length > 2000) return NextResponse.json({ error: 'Заполните ник, дисциплину и заслугу (до 2000 символов)' }, { status: 400 });
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(imageData) || imageData.length > 4_500_000) return NextResponse.json({ error: 'Загрузите изображение PNG, JPG или WebP размером до 3 МБ' }, { status: 400 });
    const card = await prisma.legendCard.upsert({
      where: { legendNumber: state.legendNumber },
      create: { legendNumber: state.legendNumber, nickname, discipline, achievement, imageData },
      update: { nickname, discipline, achievement, imageData },
    });
    return NextResponse.json({ card });
  }

  if (body?.action === 'publish-card') {
    if (state.status !== 'processing') return NextResponse.json({ error: 'Опубликовать карточку можно после завершения голосования' }, { status: 409 });
    const card = await prisma.legendCard.findUnique({ where: { legendNumber: state.legendNumber } });
    if (!card) return NextResponse.json({ error: 'Сначала заполните и сохраните карточку легенды' }, { status: 409 });
    const published = await prisma.legendCard.update({ where: { legendNumber: state.legendNumber }, data: { publishedAt: new Date() } });
    return NextResponse.json({ card: published });
  }

  if (body?.action === 'advance-round') {
    if (state.status !== 'published') return NextResponse.json({ error: 'Сначала опубликуйте карточку текущей легенды' }, { status: 409 });
    if (state.legendNumber >= LEGEND_ROUND_COUNT) return NextResponse.json({ error: `Все ${LEGEND_ROUND_COUNT} раундов уже открыты` }, { status: 409 });
    const nextLegendNumber = state.legendNumber + 1;
    const nextDeadline = new Date();
    nextDeadline.setMonth(nextDeadline.getMonth() + 1);
    await prisma.$transaction([
      prisma.appSetting.upsert({ where: { key: LEGEND_VOTE_ROUND_SETTING_KEY }, update: { value: String(nextLegendNumber) }, create: { key: LEGEND_VOTE_ROUND_SETTING_KEY, value: String(nextLegendNumber) } }),
      prisma.appSetting.upsert({ where: { key: LEGEND_VOTE_DEADLINE_SETTING_KEY }, update: { value: nextDeadline.toISOString() }, create: { key: LEGEND_VOTE_DEADLINE_SETTING_KEY, value: nextDeadline.toISOString() } }),
    ]);
    return NextResponse.json({ activeLegendNumber: nextLegendNumber, deadlineAt: nextDeadline });
  }

  return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
}
