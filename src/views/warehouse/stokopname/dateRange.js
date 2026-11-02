/**
 * Helper rentang tanggal Stockopname (STOK-FE-001).
 * Zona waktu acuan: Asia/Makassar (WITA). Format: YYYY-MM-DD.
 */
export const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

const toUtcMs = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const fromUtcMs = (ms) => new Date(ms).toISOString().slice(0, 10);

export function getTodayWita(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

/** Default: hari ini dikurangi 1 tahun ditambah 1 hari s/d hari ini (365 hari). */
export function getDefaultDateRange(now = new Date()) {
  const today = getTodayWita(now);
  const [y, m, d] = today.split('-').map(Number);
  const from = fromUtcMs(Date.UTC(y - 1, m - 1, d) + DAY_MS);
  return { date_from: from, date_to: today };
}

/** Jumlah hari inklusif. */
export function countRangeDays(from, to) {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS) + 1;
}

/** Mengembalikan pesan error (string) atau '' bila valid. Kosong dianggap valid (kembali ke default). */
export function validateDateRange(from, to) {
  if (!from || !to) return '';
  if (!ISO_RE.test(from) || !ISO_RE.test(to)) return 'Format tanggal tidak valid.';
  if (from > to) return 'Dari Tanggal tidak boleh lebih besar dari Sampai Tanggal.';
  if (countRangeDays(from, to) > MAX_RANGE_DAYS) return `Rentang tanggal maksimal ${MAX_RANGE_DAYS} hari.`;
  return '';
}

/** Isi kosong dengan default. */
export function normalizeDateRange(from, to, now = new Date()) {
  const def = getDefaultDateRange(now);
  return { date_from: from || def.date_from, date_to: to || def.date_to };
}

export function isDefaultDateRange(from, to, now = new Date()) {
  const def = getDefaultDateRange(now);
  return from === def.date_from && to === def.date_to;
}
