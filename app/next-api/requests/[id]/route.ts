import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { REGION_LABELS, RegionType } from '@/src/types';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { action } = (await req.json()) ?? {};
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const request = await prisma.tournamentRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
  }

  if (action === 'reject') {
    const updated = await prisma.tournamentRequest.update({
      where: { id: params.id },
      data: { status: 'rejected' },
    });
    return NextResponse.json({ request: updated });
  }

  const [tournament, updatedRequest] = await prisma.$transaction([
    prisma.tournament.create({
      data: {
        name: request.name,
        game: request.game,
        format: 'offline',
        region: request.region,
        country: REGION_LABELS[request.region as RegionType] ?? request.region,
        city: '—',
        startDate: request.startDate,
        endDate: request.endDate,
        status: 'upcoming',
        prizePool: '—',
        playersCount: 0,
        description: request.comment || 'Без описания',
        bannerUrl: request.bannerUrl,
        organizerName: '—',
        sourceUrl: request.url,
      },
    }),
    prisma.tournamentRequest.update({
      where: { id: params.id },
      data: { status: 'approved' },
    }),
  ]);

  return NextResponse.json({ request: updatedRequest, tournament });
}
