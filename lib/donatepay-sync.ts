import { prisma } from '@/lib/db';
import { SETTING_KEYS, getSetting, setSetting } from '@/lib/app-settings';
import {
  DONATEPAY_PAGE_SIZE,
  fetchDonatePayPage,
  parseDonatePayTransaction,
  type ParsedDonation,
} from '@/lib/donatepay';

const MAX_PAGES = 50;
const PAGE_PAUSE_MS = 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_CHECK_DELAY_MS = 2 * 60 * 1000;
const SYNC_EVERY_MS = 24 * 60 * 60 * 1000;
const RETRY_AFTER_FAILURE_MS = 3 * 60 * 60 * 1000;

export interface DonatePaySyncResult {
  imported: number;
  skippedCurrency: number;
  published: boolean;
}

export class DonatePayNotConfiguredError extends Error {
  constructor() {
    super('Ключ DonatePay не задан');
  }
}

let running = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function logSync(label: string, imported: number, failCount: number, details: string | null) {
  try {
    await prisma.exportLog.create({
      data: { platform: 'donatepay', serverId: label, successCount: imported, failCount, details },
    });
  } catch {
    // Logging must never break the sync it describes.
  }
}

// Pulls successful RUB donations from DonatePay, newest first, and stores the
// ones not seen before. Stops as soon as a whole page is already known, so a
// daily run is usually a single request; the first run walks the full history.
// New rows are hidden until approved unless auto-publish is switched on.
export async function syncDonatePay(trigger: 'auto' | 'manual'): Promise<DonatePaySyncResult> {
  if (running) throw new Error('Синхронизация уже выполняется');
  const token = (await getSetting(SETTING_KEYS.donatepayApiKey))?.trim();
  if (!token) throw new DonatePayNotConfiguredError();

  running = true;
  const label = trigger === 'auto' ? 'Автоматически' : 'Вручную';
  await setSetting(SETTING_KEYS.donatepayLastAttempt, new Date().toISOString());

  let imported = 0;
  let skippedCurrency = 0;
  try {
    const published = (await getSetting(SETTING_KEYS.donatepayAutoPublish)) === '1';

    for (let page = 0; page < MAX_PAGES; page++) {
      if (page > 0) await sleep(PAGE_PAUSE_MS);
      const transactions = await fetchDonatePayPage(token, page * DONATEPAY_PAGE_SIZE);

      const parsed: ParsedDonation[] = [];
      for (const t of transactions) {
        const result = parseDonatePayTransaction(t);
        if (result.ok) parsed.push(result.data);
        else if (result.reason === 'currency') skippedCurrency++;
      }

      const known = new Set(
        (await prisma.donation.findMany({
          where: { externalId: { in: parsed.map((d) => d.externalId) } },
          select: { externalId: true },
        })).map((d) => d.externalId),
      );
      const fresh = parsed.filter((d) => !known.has(d.externalId));
      if (fresh.length > 0) {
        const created = await prisma.donation.createMany({
          data: fresh.map((d) => ({ ...d, hidden: !published })),
          skipDuplicates: true,
        });
        imported += created.count;
      }

      const wholePageKnown = parsed.length > 0 && fresh.length === 0 && skippedCurrency === 0;
      if (transactions.length < DONATEPAY_PAGE_SIZE || wholePageKnown) break;
    }

    await setSetting(SETTING_KEYS.donatepayLastSync, new Date().toISOString());
    await logSync(
      label,
      imported,
      0,
      [
        imported > 0 && !published ? 'Новые платежи скрыты до одобрения' : null,
        skippedCurrency > 0 ? `Пропущено платежей не в рублях: ${skippedCurrency}` : null,
      ].filter(Boolean).join('. ') || null,
    );
    return { imported, skippedCurrency, published };
  } catch (e) {
    const message = (e instanceof Error ? e.message : String(e)).split(token).join('***').slice(0, 500);
    await logSync(label, imported, 1, message);
    throw e;
  } finally {
    running = false;
  }
}

async function checkDue() {
  const [lastSync, lastAttempt] = await Promise.all([
    getSetting(SETTING_KEYS.donatepayLastSync),
    getSetting(SETTING_KEYS.donatepayLastAttempt),
  ]);
  const now = Date.now();
  const syncedRecently = lastSync && now - new Date(lastSync).getTime() < SYNC_EVERY_MS;
  const triedRecently = lastAttempt && now - new Date(lastAttempt).getTime() < RETRY_AFTER_FAILURE_MS;
  if (syncedRecently || triedRecently) return;

  try {
    await syncDonatePay('auto');
  } catch (e) {
    if (!(e instanceof DonatePayNotConfiguredError)) console.error('[donatepay-sync] failed', e);
  }
}

let started = false;

// Checks hourly (and shortly after start-up) whether a daily sync is due, so a
// restart or deploy never skips or doubles a day.
export function startDonatePayScheduler() {
  if (started) return;
  started = true;
  console.log('[donatepay-sync] scheduler started, checking hourly');
  const tick = () => checkDue().catch((e) => console.error('[donatepay-sync] check failed', e));
  setTimeout(tick, FIRST_CHECK_DELAY_MS);
  setInterval(tick, CHECK_INTERVAL_MS);
}
