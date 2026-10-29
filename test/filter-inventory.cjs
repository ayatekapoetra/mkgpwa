const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const entries = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (file.endsWith('.js')) {
      const source = fs.readFileSync(file, 'utf8');
      const match = source.match(/useFilterStorage\(\s*['"]([^'"]+)['"]/)
        || (file === 'src/views/operational/daily-activity/index.js' ? [null, 'mkg_filter_operational_daily_activity'] : null);
      if (match) entries.push({ file, key: match[1], additionalKeys: file === 'src/views/operational/daily-activity/index.js' ? ['mkg_filter_operational_daily_activity_plan'] : [], pagination: source.includes('preservePagination: true') ? 'preserve BD-001' : 'restore defaults page1; omit page/offset', coverage: 'AC-02 static inventory; AC-03..07 shared hook tests; runtime QA pending' });
    }
  }
}
walk('src/views');
entries.sort((a, b) => a.file.localeCompare(b.file));
assert.equal(entries.length, 51);
assert.equal(new Set(entries.map((e) => e.key)).size, 51);
const extras = ['operational/timesheet', 'scm/order-payment', 'human-capital/crew-work-activity'];
const official = entries.filter((e) => !extras.some((name) => e.file.includes(name)));
assert.equal(official.length, 48);
const expected = {
  scm: ['purchasing-orders', 'purchasing-request', 'goods-receipt', 'pickup-order', 'delivery-order', 'shipping-order'],
  warehouse: ['goods-issues', 'stokopname', 'transfers'],
  operational: ['daily-activity', 'equipment-mobilization', 'rental-contract', 'mining/daily-checker-pit', 'mining/daily-checker-stockpile', 'mining/fleet-assignment', 'mining/mining-production-plan'],
  maintenance: ['breakdown', 'work-order'],
  laporan: ['monitoring-order-part', 'monitoring-sparepart-stock', 'monitoring-stock-sparepart', 'part-used-history', 'event-history', 'operating-history', 'productivity', 'stokopname', 'summary-breakdown', 'pemakaian-barang'],
  master: ['barang', 'cabang', 'dom', 'equipment', 'harga-beli', 'kegiatan-kerja', 'lokasi-kerja', 'material', 'pemasok', 'penyewa', 'unit-bisnis'],
  'human-capital': ['absensi-karyawan'],
  accounting: ['pengajuan-dana'],
  other: ['penugasan-kerja'],
  setting: ['user-access', 'kegiatan-tag', 'timesheet-tag', 'wa-config-breakdown']
};
const expectedDirs = Object.entries(expected).flatMap(([module, names]) => names.map((name) => `src/views/${module}/${name}`));
expectedDirs.push('src/views/integration-issues', 'src/views/asset-purchases');
assert.deepEqual(official.map((e) => path.dirname(e.file)).sort(), expectedDirs.sort());
const allKeys = entries.flatMap((e) => [e.key, ...e.additionalKeys]);
assert.equal(allKeys.length, 52); // daily-activity plan and realized share one component, isolated keys.
assert.equal(new Set(allKeys).size, 52);
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/filter-inventory.json', JSON.stringify({ officialCount: official.length, standardizedExisting: extras, total: entries.length, entries }, null, 2) + '\n');
console.log(`AC-02: ${official.length} PRD pages + ${extras.length} existing standardized = ${entries.length}; keys unique`);
for (const name of ['jsdom', 'react-test-renderer', 'playwright']) {
  try { console.log(name, require.resolve(name)); } catch { console.log(name, 'not installed'); }
}
