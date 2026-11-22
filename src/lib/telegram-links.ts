export function getTelegramBotUrl(botName: string | null | undefined): string | null {
  const username = botName?.trim().replace(/^@+/, '');
  return username ? `https://t.me/${encodeURIComponent(username)}` : null;
}
