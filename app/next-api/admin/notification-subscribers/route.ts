import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const subscribers = await prisma.user.findMany({
    where: { notifyOnRequests: true },
    select: { id: true, name: true, email: true, telegramChatId: true },
    orderBy: { email: 'asc' },
  });

  return NextResponse.json(subscribers);
}
