import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isValidBannerDataUrl } from '@/src/lib/banner-constraints';
import { isValidDateString, isValidTimeString } from '@/lib/date-validation';

export const dynamic = 'force-dynamic';

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
  const { name, url, comment, startDate, endDate, startTime, region, game, format, bannerUrl } = body ?? {};

  if (!name?.trim() || !startDate || !endDate || !region || !game || !format) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return NextResponse.json({ error: 'Некорректный формат даты' }, { status: 400 });
  }

  if (startDate > endDate) {
    return NextResponse.json({ error: 'Дата начала не может быть позже даты завершения' }, { status: 400 });
  }

  if (startTime && !isValidTimeString(startTime)) {
    return NextResponse.json({ error: 'Некорректный формат времени' }, { status: 400 });
  }

  if (bannerUrl && !isValidBannerDataUrl(bannerUrl)) {
    return NextResponse.json({ error: 'Invalid banner image' }, { status: 400 });
  }

  const request = await prisma.tournamentRequest.create({
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
  });

  return NextResponse.json(request, { status: 201 });
}
