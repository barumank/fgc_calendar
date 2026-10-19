import { prisma } from '@/lib/db';
import { isValidDateString } from '@/lib/date-validation';
import { normalizeHttpUrl } from '@/src/lib/leagues';

export interface LeagueInput {
  name: string;
  game: string;
  startDate: string;
  endDate: string;
  registrationUrl: string | null;
  discordUrl: string | null;
}

export async function parseLeagueInput(body: any): Promise<{ data: LeagueInput } | { error: string }> {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const game = typeof body?.game === 'string' ? body.game.trim() : '';
  const startDate = body?.startDate;
  const endDate = body?.endDate;

  if (!name) return { error: 'Укажите название лиги' };
  if (name.length > 120) return { error: 'Название лиги слишком длинное (максимум 120 символов)' };
  if (!game || !(await prisma.game.findUnique({ where: { key: game }, select: { id: true } }))) {
    return { error: 'Выберите дисциплину из списка' };
  }
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) return { error: 'Укажите даты начала и окончания' };
  if (startDate > endDate) return { error: 'Дата начала не может быть позже даты окончания' };

  const rawRegistration = typeof body?.registrationUrl === 'string' ? body.registrationUrl.trim() : '';
  const rawDiscord = typeof body?.discordUrl === 'string' ? body.discordUrl.trim() : '';
  const registrationUrl = normalizeHttpUrl(rawRegistration);
  const discordUrl = normalizeHttpUrl(rawDiscord);
  if (rawRegistration && !registrationUrl) return { error: 'Ссылка на регистрацию должна начинаться с http:// или https://' };
  if (rawDiscord && !discordUrl) return { error: 'Ссылка на Discord должна начинаться с http:// или https://' };

  return { data: { name, game, startDate, endDate, registrationUrl, discordUrl } };
}
