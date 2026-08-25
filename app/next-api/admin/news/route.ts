import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['announcement', 'results', 'update', 'interview'];

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const body = await req.json();
  const title = (body?.title ?? '').trim();
  const content = (body?.content ?? '').trim();
  const category = body?.category;

  if (!title || !content) {
    return NextResponse.json({ error: 'Название и текст новости обязательны' }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Некорректный тип новости' }, { status: 400 });
  }

  const news = await prisma.news.create({ data: { title, content, category, authorId: session!.user.id } });
  return NextResponse.json(news, { status: 201 });
}
