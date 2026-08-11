import { prisma } from '@/lib/db';

export const SETTING_KEYS = {
  discordBotToken: 'discord_bot_token',
  discordInviteUrl: 'discord_invite_url',
  telegramBotName: 'telegram_bot_name',
  telegramBotToken: 'telegram_bot_token',
  telegramWebhookSecret: 'telegram_webhook_secret',
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
