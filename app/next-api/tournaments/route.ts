import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  // bannerUrl is a base64 data URL and can be several MB per tournament —
  // fetching it for the whole list made this endpoint return tens of MB of
  // JSON on every calendar page load. It's fetched on demand instead, via
  // GET /next-api/tournaments/[id], only for the one tournament being viewed.
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      name: true,
      game: true,
      format: true,
      region: true,
      city: true,
      startDate: true,
      endDate: true,
      startTime: true,
      status: true,
      playersCount: true,
      description: true,
      organizerName: true,
      sourceUrl: true,
      communicationUrl: true,
      featured: true,
      requestId: true,
      discordEventId: true,
      createdAt: true,
    },
  });
  return NextResponse.json(tournaments);
}
