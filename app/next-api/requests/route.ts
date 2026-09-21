import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidBannerDataUrl } from '@/src/lib/banner-constraints';
import { isValidDateString, isValidTimeString, tournamentDurationDays, MAX_TOURNAMENT_DURATION_DAYS } from '@/lib/date-validation';
import { getClientIp } from '@/lib/client-ip';
import { isRateLimited, pruneOldSubmissions } from '@/lib/rate-limit';
import { notifyNewRequestSubscribers } from '@/lib/notify-request';
import { requireRole } from '@/lib/require-role';
import { extractChallongeSlug } from '@/lib/challonge';
import { extractStartggEventSlug } from '@/lib/startgg';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_KIND = 'tournament_request';
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function GET() {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  // bannerUrl is a base64 data URL and can be several MB per request — the
  // list used to include it for all requests, so this endpoint returned
  // tens of MB of JSON on every load. It's fetched on demand instead, via
  // GET /next-api/requests/[id], only for the one request being viewed.
  const requests = await prisma.tournamentRequest.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      url: true,
      communicationUrl: true,
      comment: true,
      startDate: true,
      endDate: true,
      startTime: true,
      region: true,
      city: true,
      game: true,
      format: true,
      status: true,
      createdAt: true,
    },
  });

  // "Ждут результата": an approved request with at least one tournament
  // that has a collectible bracket link (Challonge/start.gg) but no
  // resultsFetchedAt yet. Requests with no collectible source never count,
  // since there's nothing to actually collect for them.
  const approvedIds = requests.filter((r) => r.status === 'approved').map((r) => r.id);
  const tournaments = approvedIds.length
    ? await prisma.tournament.findMany({
        where: { requestId: { in: approvedIds } },
        select: { requestId: true, sourceUrl: true, resultsFetchedAt: true },
      })
    : [];

  const pendingRequestIds = new Set<string>();
  for (const t of tournaments) {
    if (!t.requestId || t.resultsFetchedAt) continue;
    if (extractChallongeSlug(t.sourceUrl) || extractStartggEventSlug(t.sourceUrl)) {
      pendingRequestIds.add(t.requestId);
    }
  }

  const result = requests.map((r) => ({ ...r, resultsPending: pendingRequestIds.has(r.id) }));
  return NextResponse.json(result);
}

const DEFAULT_ONLINE_REGION = 'other';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, url, communicationUrl, comment, startDate, endDate, startTime, region, city, game, format, bannerUrl, website } = body ?? {};

  // Honeypot: this field is hidden from real users but bots that
  // auto-fill forms tend to populate it. Pretend success and stop.
  if (website) {
    return NextResponse.json({ id: 'ok' }, { status: 201 });
  }

  const ip = getClientIp(req);
  if (await isRateLimited(RATE_LIMIT_KIND, ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Слишком много заявок с вашего адреса. Попробуйте позже.' }, { status: 429 });
  }

  if (!name?.trim() || !startDate || !endDate || !startTime || !game || !format) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (format === 'offline' && (!region || !city?.trim())) {
    return NextResponse.json({ error: 'Для офлайн-турнира укажите регион и город' }, { status: 400 });
  }

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return NextResponse.json({ error: 'Некорректный формат даты' }, { status: 400 });
  }

  if (startDate > endDate) {
    return NextResponse.json({ error: 'Дата начала не может быть позже даты завершения' }, { status: 400 });
  }

  if (tournamentDurationDays(startDate, endDate) > MAX_TOURNAMENT_DURATION_DAYS) {
    return NextResponse.json({ error: `Продолжительность турнира не может быть более ${MAX_TOURNAMENT_DURATION_DAYS} суток` }, { status: 400 });
  }

  if (startTime && !isValidTimeString(startTime)) {
    return NextResponse.json({ error: 'Некорректный формат времени' }, { status: 400 });
  }

  if (bannerUrl && !isValidBannerDataUrl(bannerUrl)) {
    return NextResponse.json({ error: 'Invalid banner image' }, { status: 400 });
  }

  const [request] = await prisma.$transaction([
    prisma.tournamentRequest.create({
      data: {
        name: name.trim(),
        url: url || null,
        communicationUrl: communicationUrl || null,
        comment: comment || null,
        startDate,
        endDate,
        startTime: startTime || null,
        region: format === 'offline' ? region : DEFAULT_ONLINE_REGION,
        city: format === 'offline' ? city.trim() : null,
        game,
        format,
        bannerUrl: bannerUrl || null,
        status: 'pending',
      },
    }),
    prisma.requestSubmission.create({ data: { kind: RATE_LIMIT_KIND, ip } }),
  ]);

  pruneOldSubmissions();
  notifyNewRequestSubscribers(request).catch(() => {});

  return NextResponse.json(request, { status: 201 });
}
