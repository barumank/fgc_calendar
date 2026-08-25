import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const news = await prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });
  return NextResponse.json(news);
}
