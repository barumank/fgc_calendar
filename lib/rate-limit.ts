import { prisma } from '@/lib/db';

const RETENTION_MS = 24 * 60 * 60 * 1000;

export async function isRateLimited(kind: string, ip: string, max: number, windowMs: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs);
  const count = await prisma.requestSubmission.count({ where: { kind, ip, createdAt: { gte: windowStart } } });
  return count >= max;
}

export async function recordSubmission(kind: string, ip: string): Promise<void> {
  await prisma.requestSubmission.create({ data: { kind, ip } });
  pruneOldSubmissions();
}

export function pruneOldSubmissions(): void {
  prisma.requestSubmission
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
    .catch(() => {});
}
