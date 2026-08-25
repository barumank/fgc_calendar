import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['announcement', 'results', 'update', 'interview'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const existing = await prisma.news.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Новость не найдена' }, { status: 404 });
  }

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

  const news = await prisma.news.update({ where: { id: params.id }, data: { title, content, category } });
  return NextResponse.json(news);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const existing = await prisma.news.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Новость не найдена' }, { status: 404 });
  }

  await prisma.news.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
