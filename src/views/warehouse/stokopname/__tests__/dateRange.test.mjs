import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultDateRange,
  getTodayWita,
  countRangeDays,
  validateDateRange,
  normalizeDateRange,
  isDefaultDateRange
} from '../dateRange.js';

test('default range = hari ini - 1 tahun + 1 hari s/d hari ini (365 hari)', () => {
  const r = getDefaultDateRange(new Date('2026-11-02T01:00:00Z'));
  assert.deepEqual(r, { date_from: '2025-11-03', date_to: '2026-11-02' });
  assert.equal(countRangeDays(r.date_from, r.date_to), 365);
});

test('hari ini memakai WITA (UTC+8), melewati tengah malam UTC', () => {
  assert.equal(getTodayWita(new Date('2026-11-01T16:30:00Z')), '2026-11-02');
  assert.equal(getTodayWita(new Date('2026-11-01T15:30:00Z')), '2026-11-01');
});

test('default pada 29 Februari tetap dalam batas maksimum', () => {
  const r = getDefaultDateRange(new Date('2028-02-29T04:00:00Z'));
  assert.equal(r.date_to, '2028-02-29');
  assert.equal(validateDateRange(r.date_from, r.date_to), '');
});

test('validasi Dari <= Sampai', () => {
  assert.match(validateDateRange('2026-05-02', '2026-05-01'), /tidak boleh lebih besar/);
  assert.equal(validateDateRange('2026-05-01', '2026-05-01'), '');
});

test('validasi maksimum 366 hari', () => {
  assert.equal(validateDateRange('2025-11-02', '2026-11-02'), '');
  assert.match(validateDateRange('2025-11-01', '2026-11-02'), /maksimal 366 hari/);
  assert.match(validateDateRange('2020-01-01', '2026-11-02'), /maksimal 366 hari/);
});

test('kosong valid dan dinormalisasi ke default', () => {
  const now = new Date('2026-11-02T01:00:00Z');
  assert.equal(validateDateRange('', '2026-11-02'), '');
  assert.deepEqual(normalizeDateRange('', '', now), getDefaultDateRange(now));
  assert.deepEqual(normalizeDateRange('2026-10-01', '', now), { date_from: '2026-10-01', date_to: '2026-11-02' });
  assert.equal(isDefaultDateRange('2025-11-03', '2026-11-02', now), true);
  assert.equal(isDefaultDateRange('2026-10-01', '2026-11-02', now), false);
});
