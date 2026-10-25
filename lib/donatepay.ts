const TRANSACTIONS_URL = 'https://donatepay.ru/api/v1/transactions';
const REQUEST_TIMEOUT_MS = 20_000;

export const DONATEPAY_PAGE_SIZE = 100;
export const DONATEPAY_EXTERNAL_ID_PREFIX = 'donatepay:';

export interface DonatePayTransaction {
  id: number;
  what?: string | null;
  sum: string | number;
  currency?: string;
  status?: string;
  type?: string;
  comment?: string | null;
  created_at: string;
  vars?: { name?: string | null; comment?: string | null } | null;
}

export interface ParsedDonation {
  externalId: string;
  nickname: string;
  amount: number;
  message: string | null;
  paidAt: Date;
}

export type ParseResult = { ok: true; data: ParsedDonation } | { ok: false; reason: 'currency' | 'invalid' };

// The API reports the failure inside the body too, so a 200 is not enough.
export async function fetchDonatePayPage(token: string, skip: number): Promise<DonatePayTransaction[]> {
  const url = new URL(TRANSACTIONS_URL);
  url.searchParams.set('access_token', token);
  url.searchParams.set('type', 'donation');
  url.searchParams.set('status', 'success');
  url.searchParams.set('order', 'DESC');
  url.searchParams.set('limit', String(DONATEPAY_PAGE_SIZE));
  url.searchParams.set('skip', String(skip));

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: 'no-store' });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`Не удалось связаться с DonatePay: ${reason}`.split(token).join('***'));
  }

  if (res.status === 429) throw new Error('DonatePay: слишком много запросов (429), повторим позже');
  if (res.status === 401 || res.status === 403) throw new Error(`DonatePay отклонил ключ доступа (${res.status})`);
  if (!res.ok) throw new Error(`DonatePay вернул ошибку ${res.status}`);

  const json: any = await res.json().catch(() => null);
  if (!json || json.status !== 'success' || !Array.isArray(json.data)) {
    const detail = typeof json?.message === 'string' ? `: ${json.message}`.slice(0, 200) : '';
    throw new Error(`Неожиданный ответ DonatePay${detail}`);
  }
  return json.data as DonatePayTransaction[];
}

export function parseDonatePayTransaction(t: DonatePayTransaction): ParseResult {
  if (t.currency && t.currency !== 'RUB') return { ok: false, reason: 'currency' };

  const amount = Math.round(Number(t.sum));
  const paidAt = new Date(t.created_at);
  if (!Number.isFinite(amount) || amount < 1 || Number.isNaN(paidAt.getTime()) || t.id == null) {
    return { ok: false, reason: 'invalid' };
  }

  const nickname = (t.vars?.name ?? t.what ?? '').trim().slice(0, 60) || 'Аноним';
  const message = (t.vars?.comment ?? t.comment ?? '').trim().slice(0, 500) || null;
  return {
    ok: true,
    data: { externalId: `${DONATEPAY_EXTERNAL_ID_PREFIX}${t.id}`, nickname, amount, message, paidAt },
  };
}
