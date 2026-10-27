import { prisma } from '@/lib/db';
import { isValidBannerDataUrl } from '@/src/lib/banner-constraints';
import { isValidDateString, isValidTimeString } from '@/lib/date-validation';
import { normalizeHttpUrl } from '@/src/lib/leagues';
import { REGION_LABELS } from '@/src/types/tournament';

const DEFAULT_ONLINE_REGION = 'other';
const STATUSES = ['upcoming', 'ongoing', 'completed'];
const FORMATS = ['online', 'offline'];

export interface TournamentUpdate {
  name: string;
  game: string;
  format: string;
  region: string;
  city: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  status: string;
  playersCount: number;
  description: string;
  organizerName: string;
  sourceUrl: string | null;
  communicationUrl: string | null;
  // undefined = keep the stored banner, null = remove it, string = replace it.
  bannerUrl?: string | null;
}

function parseOptionalUrl(raw: unknown, label: string): { value: string | null } | { error: string } {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return { value: null };
  const url = normalizeHttpUrl(text);
  return url ? { value: url } : { error: `${label}: ссылка должна начинаться с http:// или https://` };
}

// The edit form always submits every field, so this validates a full record
// rather than a partial patch.
export async function parseTournamentUpdate(body: any): Promise<{ data: TournamentUpdate } | { error: string }> {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const game = typeof body?.game === 'string' ? body.game.trim() : '';
  const format = body?.format;
  const startDate = body?.startDate;
  const endDate = body?.endDate;
  const startTime = typeof body?.startTime === 'string' ? body.startTime.trim() : '';
  const status = body?.status;
  const playersCount = Number(body?.playersCount ?? 0);
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const organizerName = typeof body?.organizerName === 'string' ? body.organizerName.trim() : '';
  const city = typeof body?.city === 'string' ? body.city.trim() : '';

  if (!name) return { error: 'Укажите название турнира' };
  if (name.length > 200) return { error: 'Название слишком длинное (максимум 200 символов)' };
  if (!game || !(await prisma.game.findUnique({ where: { key: game }, select: { id: true } }))) {
    return { error: 'Выберите дисциплину из списка' };
  }
  if (!FORMATS.includes(format)) return { error: 'Выберите формат турнира' };
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) return { error: 'Укажите даты начала и завершения' };
  if (startDate > endDate) return { error: 'Дата начала не может быть позже даты завершения' };
  if (startTime && !isValidTimeString(startTime)) return { error: 'Некорректный формат времени' };
  if (!STATUSES.includes(status)) return { error: 'Выберите статус турнира' };
  if (!Number.isInteger(playersCount) || playersCount < 0 || playersCount > 100000) {
    return { error: 'Число участников должно быть целым неотрицательным числом' };
  }
  if (description.length > 5000) return { error: 'Описание слишком длинное (максимум 5000 символов)' };
  if (organizerName.length > 200) return { error: 'Название организатора слишком длинное' };

  let region = DEFAULT_ONLINE_REGION;
  if (format === 'offline') {
    if (!(body?.region in REGION_LABELS)) return { error: 'Выберите регион' };
    if (!city) return { error: 'Для офлайн-турнира укажите город' };
    region = body.region;
  }

  const source = parseOptionalUrl(body?.sourceUrl, 'Ссылка на турнир');
  if ('error' in source) return source;
  const communication = parseOptionalUrl(body?.communicationUrl, 'Ссылка на общение');
  if ('error' in communication) return communication;

  let bannerUrl: string | null | undefined;
  if (body?.bannerUrl === null) {
    bannerUrl = null;
  } else if (typeof body?.bannerUrl === 'string' && body.bannerUrl) {
    if (!isValidBannerDataUrl(body.bannerUrl)) return { error: 'Баннер должен быть JPEG или PNG размером до 5 МБ' };
    bannerUrl = body.bannerUrl;
  }

  return {
    data: {
      name,
      game,
      format,
      region,
      city: format === 'offline' ? city : null,
      startDate,
      endDate,
      startTime: startTime || null,
      status,
      playersCount,
      description: description || 'Без описания',
      organizerName: organizerName || '—',
      sourceUrl: source.value,
      communicationUrl: communication.value,
      bannerUrl,
    },
  };
}
