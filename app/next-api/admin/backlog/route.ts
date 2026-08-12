import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const items = await prisma.backlogItem.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json();
  const text = (body?.text ?? '').trim();
  if (!text) {
    return NextResponse.json({ error: 'Текст задачи обязателен' }, { status: 400 });
  }

  const item = await prisma.backlogItem.create({ data: { text, status: 'pending' } });
  return NextResponse.json(item, { status: 201 });
}
