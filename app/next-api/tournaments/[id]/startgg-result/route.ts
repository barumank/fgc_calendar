import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { extractStartggEventSlug, fetchStartggEventStandings } from '@/lib/startgg';
import { reversePreviousCredits, creditTop8 } from '@/lib/tournament-results';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const force = !!body?.force;

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 });
  }

  const alreadyCollected = await prisma.tournamentResultCredit.count({ where: { tournamentId: tournament.id } });
  if (alreadyCollected > 0 && !force) {
    return NextResponse.json(
      { error: 'Результаты уже собраны для этого турнира', resultsFetchedAt: tournament.resultsFetchedAt },
      { status: 409 },
    );
  }

  const eventSlug = extractStartggEventSlug(tournament.sourceUrl);
  if (!eventSlug) {
    return NextResponse.json({ error: 'Ссылка на турнир не похожа на событие start.gg' }, { status: 400 });
  }

  const apiToken = await getSetting(SETTING_KEYS.startggApiToken);
  if (!apiToken) {
    return NextResponse.json({ error: 'Не задан токен start.gg API в разделе «Настройки»' }, { status: 400 });
  }

  let result;
  try {
    result = await fetchStartggEventStandings(eventSlug, apiToken);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Не удалось получить результаты со start.gg' }, { status: 502 });
  }

  const top8 = result.standings
    .filter((s) => s.placement > 0)
    .sort((a, b) => a.placement - b.placement)
    .slice(0, 8);

  let players: any[] = [];
  if (top8.length > 0) {
    if (alreadyCollected > 0) await reversePreviousCredits(tournament.id);
    players = await creditTop8(
      tournament.id,
      tournament,
      top8.map((s) => ({ rank: s.placement, name: s.name, startggPlayerId: s.playerId })),
    );
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { playersCount: result.numEntrants, resultsFetchedAt: new Date() },
    });
  } else {
    await prisma.tournament.update({ where: { id: tournament.id }, data: { playersCount: result.numEntrants } });
  }

  return NextResponse.json({
    playersCount: result.numEntrants,
    top8: players,
    tournamentFinished: top8.length > 0,
  });
}
