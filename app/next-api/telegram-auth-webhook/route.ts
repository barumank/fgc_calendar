import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { sendTelegramMessage } from '@/lib/telegram';
import { generateLogin, generatePassword } from '@/lib/random-credentials';

export const dynamic = 'force-dynamic';

async function generateUniqueLogin(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateLogin();
    const exists = await prisma.user.findUnique({ where: { email: candidate } });
    if (!exists) return candidate;
  }
  // Astronomically unlikely to be needed, but stay correct under collisions.
  return `${generateLogin()}${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedSecret = await getSetting(SETTING_KEYS.authTelegramWebhookSecret);
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const chatId = update?.message?.chat?.id;
  if (!chatId) return NextResponse.json({ ok: true });

  const botToken = await getSetting(SETTING_KEYS.authTelegramBotToken);
  if (!botToken) return NextResponse.json({ ok: true });

  const chatIdStr = String(chatId);
  const existing = await prisma.user.findUnique({ where: { authTelegramChatId: chatIdStr } });

  if (existing) {
    const password = generatePassword();
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: existing.id }, data: { password: hashed } });
    const text = [
      'Ваши данные для входа на сайт:',
      `Логин: ${existing.email}`,
      `Новый пароль: ${password}`,
      '',
      'Старый пароль больше не действует.',
    ].join('\n');
    await sendTelegramMessage(botToken, chatIdStr, text).catch(() => {});
  } else {
    const login = await generateUniqueLogin();
    const password = generatePassword();
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: login,
        password: hashed,
        role: 'user',
        authTelegramChatId: chatIdStr,
        tournamentTelegramChatId: chatIdStr,
      },
    });
    const text = [
      'Добро пожаловать! Учётная запись на сайте создана.',
      `Логин: ${login}`,
      `Пароль: ${password}`,
      '',
      'Используйте эти данные, чтобы войти на сайте. Chat ID для уведомлений о турнирах уже настроен — можно сразу подписываться на турниры в Календаре.',
    ].join('\n');
    await sendTelegramMessage(botToken, chatIdStr, text).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
