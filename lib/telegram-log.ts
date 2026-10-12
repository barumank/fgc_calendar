import { prisma } from '@/lib/db';

// Records the outcome of a Telegram notification batch in the "Экспорт в
// Телеграм" tab of the admin system logs. Never throws — logging must not
// break the notification flow it describes.
export async function logTelegramBatch(label: string, successCount: number, failCount: number, error?: unknown): Promise<void> {
  const message = error == null
    ? null
    : (error instanceof Error ? error.message : String(error))
        .replace(/bot\d+:[\w-]+/g, 'bot***')
        .slice(0, 500);

  try {
    await prisma.exportLog.create({
      data: { platform: 'telegram', serverId: label.slice(0, 200), successCount, failCount, details: message },
    });
  } catch {
    // ignore
  }
}
