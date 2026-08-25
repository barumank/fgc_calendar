import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const news = await prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });

  const authorIds = [...new Set(news.map((n) => n.authorId).filter((id): id is string => !!id))];
  const authors = authorIds.length
    ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(authors.map((a) => [a.id, a.name]));

  const result = news.map(({ authorId, ...n }) => ({
    ...n,
    authorName: (authorId && nameById.get(authorId)) || undefined,
  }));

  return NextResponse.json(result);
}
