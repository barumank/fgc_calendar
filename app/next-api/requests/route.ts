import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidBannerDataUrl } from '@/src/lib/banner-constraints';

export const dynamic = 'force-dynamic';

export async function GET() {
  const requests = await prisma.tournamentRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, url, comment, startDate, endDate, region, game, format, bannerUrl } = body ?? {};

  if (!name?.trim() || !startDate || !endDate || !region || !game || !format) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      region,
      game,
      format,
      bannerUrl: bannerUrl || null,
      status: 'pending',
    },
  });

  return NextResponse.json(request, { status: 201 });
}
