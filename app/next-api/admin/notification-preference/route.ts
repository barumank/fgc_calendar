import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ notifyOnRequests: user.notifyOnRequests, telegramChatId: user.telegramChatId ?? '' });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const notifyOnRequests = !!body?.notifyOnRequests;
  const telegramChatId = (body?.telegramChatId ?? '').trim();

  if (notifyOnRequests && !telegramChatId) {
    return NextResponse.json({ error: 'Укажите Chat ID, чтобы включить уведомления' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { notifyOnRequests, telegramChatId: telegramChatId || null },
  });

  return NextResponse.json({ notifyOnRequests: user.notifyOnRequests, telegramChatId: user.telegramChatId ?? '' });
}
