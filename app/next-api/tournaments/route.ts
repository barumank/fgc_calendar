import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tournaments = await prisma.tournament.findMany({ orderBy: { startDate: 'asc' } });
  return NextResponse.json(tournaments);
}
