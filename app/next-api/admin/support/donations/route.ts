import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { parseDonationInput } from '@/lib/support-input';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const donations = await prisma.donation.findMany({ orderBy: { paidAt: 'desc' } });
  return NextResponse.json(donations);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const parsed = parseDonationInput(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const donation = await prisma.donation.create({ data: parsed.data });
  return NextResponse.json(donation, { status: 201 });
}
