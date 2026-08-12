import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Role } from '@/lib/roles';

export async function requireRole(allowed: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const role = (session.user.role ?? 'user') as Role;
  if (!allowed.includes(role)) {
    return { session, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null as null };
}
