import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const { action } = (await req.json()) ?? {};
  if (!['approve', 'reject', 'unapprove'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const request = await prisma.tournamentRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (action === 'reject') {
    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
    }
    const updated = await prisma.tournamentRequest.update({
      where: { id: params.id },
      data: { status: 'rejected' },
    });
    return NextResponse.json({ request: updated });
  }

  if (action === 'approve') {
    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
    }
    const [tournament, updatedRequest] = await prisma.$transaction([
      prisma.tournament.create({
        data: {
          name: request.name,
          game: request.game,
          format: request.format,
          region: request.region,
          city: request.city,
          startDate: request.startDate,
          endDate: request.endDate,
          startTime: request.startTime,
          status: 'upcoming',
          playersCount: 0,
          description: request.comment || 'Без описания',
          bannerUrl: request.bannerUrl,
          organizerName: '—',
          sourceUrl: request.url,
          requestId: request.id,
        },
      }),
      prisma.tournamentRequest.update({
        where: { id: params.id },
        data: { status: 'approved' },
      }),
    ]);
    return NextResponse.json({ request: updatedRequest, tournament });
  }

  // action === 'unapprove'
  if (request.status !== 'approved') {
    return NextResponse.json({ error: 'Request is not approved' }, { status: 409 });
  }
  const [, updatedRequest] = await prisma.$transaction([
    prisma.tournament.deleteMany({ where: { requestId: request.id } }),
    prisma.tournamentRequest.update({
      where: { id: params.id },
      data: { status: 'pending' },
    }),
  ]);
  return NextResponse.json({ request: updatedRequest });
}
