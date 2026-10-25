import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

// Only the visibility flag is editable: payments imported from the donation
// service must stay as they were received.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (typeof body?.hidden !== 'boolean') {
    return NextResponse.json({ error: 'Укажите, скрыт ли платёж' }, { status: 400 });
  }
  const existing = await prisma.donation.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Платёж не найден' }, { status: 404 });
  }

  const donation = await prisma.donation.update({ where: { id: params.id }, data: { hidden: body.hidden } });
  return NextResponse.json(donation);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.donation.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Платёж не найден' }, { status: 404 });
  }

  await prisma.donation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
