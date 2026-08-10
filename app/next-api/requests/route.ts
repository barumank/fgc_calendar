import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isValidBannerDataUrl } from '@/src/lib/banner-constraints';
import { isValidDateString, isValidTimeString, tournamentDurationDays, MAX_TOURNAMENT_DURATION_DAYS } from '@/lib/date-validation';
import { getClientIp } from '@/lib/client-ip';
import { isRateLimited, pruneOldSubmissions } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_KIND = 'tournament_request';
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.tournamentRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, url, comment, startDate, endDate, startTime, region, game, format, bannerUrl, website } = body ?? {};

  // Honeypot: this field is hidden from real users but bots that
  // auto-fill forms tend to populate it. Pretend success and stop.
  if (website) {
    return NextResponse.json({ id: 'ok' }, { status: 201 });
  }

  const ip = getClientIp(req);
  if (await isRateLimited(RATE_LIMIT_KIND, ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Слишком много заявок с вашего адреса. Попробуйте позже.' }, { status: 429 });
  }

  if (!name?.trim() || !startDate || !endDate || !region || !game || !format) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
        comment: comment || null,
        startDate,
        endDate,
        startTime: startTime || null,
        region,
        game,
        format,
        bannerUrl: bannerUrl || null,
        status: 'pending',
      },
    }),
    prisma.requestSubmission.create({ data: { kind: RATE_LIMIT_KIND, ip } }),
  ]);

  pruneOldSubmissions();

  return NextResponse.json(request, { status: 201 });
}
