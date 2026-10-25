import { normalizeHttpUrl } from '@/src/lib/leagues';

const MAX_AMOUNT = 10_000_000;
const MAX_GOAL = 100_000_000;

export interface DonationInput {
  nickname: string;
  amount: number;
  message: string | null;
  paidAt: Date;
}

export function parseDonationInput(body: any): { data: DonationInput } | { error: string } {
  const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const amount = Number(body?.amount);
  const paidAt = new Date(body?.paidAt);

  if (!nickname) return { error: 'Укажите никнейм' };
  if (nickname.length > 60) return { error: 'Никнейм слишком длинный (максимум 60 символов)' };
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
    return { error: 'Сумма должна быть целым числом рублей больше нуля' };
  }
  if (message.length > 500) return { error: 'Сообщение слишком длинное (максимум 500 символов)' };
  if (Number.isNaN(paidAt.getTime())) return { error: 'Укажите дату и время платежа' };

  return { data: { nickname, amount, message: message || null, paidAt } };
}

export interface SupportSettingsInput {
  goalAmount: number;
  donateUrl: string;
  developerMessage: string;
  // Empty means "keep the stored key".
  donatepayApiKey: string;
  autoPublish: boolean;
}

export function parseSupportSettingsInput(body: any): { data: SupportSettingsInput } | { error: string } {
  const goalAmount = Number(body?.goalAmount);
  const rawUrl = typeof body?.donateUrl === 'string' ? body.donateUrl.trim() : '';
  const developerMessage = typeof body?.developerMessage === 'string' ? body.developerMessage.trim() : '';

  if (!Number.isInteger(goalAmount) || goalAmount < 0 || goalAmount > MAX_GOAL) {
    return { error: 'Цель должна быть целым числом рублей (0 — цель не задана)' };
  }
  const donateUrl = rawUrl ? normalizeHttpUrl(rawUrl) : '';
  if (rawUrl && !donateUrl) return { error: 'Ссылка на оплату должна начинаться с http:// или https://' };
  if (developerMessage.length > 3000) return { error: 'Сообщение слишком длинное (максимум 3000 символов)' };

  const donatepayApiKey = typeof body?.donatepayApiKey === 'string' ? body.donatepayApiKey.trim() : '';
  if (donatepayApiKey && (donatepayApiKey.length > 200 || /\s/.test(donatepayApiKey))) {
    return { error: 'Ключ DonatePay выглядит некорректно' };
  }

  return {
    data: { goalAmount, donateUrl: donateUrl ?? '', developerMessage, donatepayApiKey, autoPublish: body?.autoPublish === true },
  };
}
