import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createDiscordScheduledEvent, getScheduledStart } from '@/lib/discord';
import { getClientIp } from '@/lib/client-ip';
import { isRateLimited, recordSubmission } from '@/lib/rate-limit';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';

export const dynamic = 'force-dynamic';

const REQUEST_DELAY_MS = 300;
const MAX_TOURNAMENTS_PER_REQUEST = 50;
const RATE_LIMIT_KIND = 'discord_export';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

interface ExportResult {
  id: string;
  name: string;
  status: 'created' | 'skipped' | 'error';
  error?: string;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(RATE_LIMIT_KIND, ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Слишком много экспортов с вашего адреса. Попробуйте позже.' }, { status: 429 });
  }

  const body = await req.json();
  const guildId = (body?.guildId ?? '').trim();
  const tournamentIds: string[] = Array.isArray(body?.tournamentIds) ? body.tournamentIds : [];

  if (!guildId) {
    return NextResponse.json({ error: 'Server ID обязателен' }, { status: 400 });
  }

  const botToken = await getSetting(SETTING_KEYS.discordBotToken);
  if (!botToken) {
    return NextResponse.json({ error: 'Discord-бот пока не настроен администратором сайта' }, { status: 503 });
  }

  if (tournamentIds.length === 0) {
    return NextResponse.json({ error: 'Нет турниров для экспорта' }, { status: 400 });
  }
  if (tournamentIds.length > MAX_TOURNAMENTS_PER_REQUEST) {
    return NextResponse.json({ error: `За один раз можно экспортировать не более ${MAX_TOURNAMENTS_PER_REQUEST} турниров — сузьте фильтры` }, { status: 400 });
  }

  await recordSubmission(RATE_LIMIT_KIND, ip);

  const tournaments = await prisma.tournament.findMany({ where: { id: { in: tournamentIds } } });

  const results: ExportResult[] = [];

  for (const t of tournaments) {
    if (t.discordEventId) {
      results.push({ id: t.id, name: t.name, status: 'skipped', error: 'уже экспортирован ранее' });
      continue;
    }

    if (getScheduledStart(t.startDate, t.startTime).getTime() <= Date.now()) {
      results.push({ id: t.id, name: t.name, status: 'skipped', error: 'турнир уже начался или прошёл' });
      continue;
    }

    try {
      const eventId = await createDiscordScheduledEvent(guildId, botToken, {
        name: t.name,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        startTime: t.startTime,
        format: t.format,
        city: t.city,
        country: t.country,
        sourceUrl: t.sourceUrl,
        bannerUrl: t.bannerUrl,
      });
      await prisma.tournament.update({ where: { id: t.id }, data: { discordEventId: eventId } });
      results.push({ id: t.id, name: t.name, status: 'created' });
    } catch (e: any) {
      results.push({ id: t.id, name: t.name, status: 'error', error: e?.message ?? 'Unknown error' });
    }

    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  return NextResponse.json({ results });
}
