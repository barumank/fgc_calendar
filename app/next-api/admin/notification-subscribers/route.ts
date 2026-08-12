import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscribers = await prisma.user.findMany({
    where: { notifyOnRequests: true },
    select: { id: true, name: true, email: true, telegramChatId: true },
    orderBy: { email: 'asc' },
  });

  return NextResponse.json(subscribers);
}
