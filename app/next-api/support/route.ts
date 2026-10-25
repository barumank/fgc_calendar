import { NextResponse } from 'next/server';
import { getSupportSummary } from '@/lib/support';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getSupportSummary());
}
