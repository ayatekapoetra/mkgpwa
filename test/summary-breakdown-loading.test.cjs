const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('next/dist/build/swc');

// Execute the actual component and effects with mocked masters; not browser E2E.
const code = transformSync(fs.readFileSync(path.join(__dirname, '../src/views/laporan/summary-breakdown/filter.js'), 'utf8'), {
  filename: 'filter.js',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' },
  module: { type: 'commonjs' }
}).code;

function harness() {
  let params = { areas: ['QA-AREA'], lokasi_ids: [], equipment_ids: [101], penyewa_ids: [], problem_issue: '', page: 3 };
  let masters;
  let effects;
  const react = { useState: (init) => [init, () => {}], useMemo: (fn) => fn(), useEffect: (fn) => effects.push(fn), createElement: () => null };
  const mocks = {
    react,
    'api/cabang': { usePublicCabang: () => masters.cabang },
    'api/equipment': { usePublicEquipment: () => masters.equipment },
    'api/lokasi-mining': { useGetLokasiKerja: () => ({ data: [], dataLoading: true }) },
    'api/penyewa': { usePublicPenyewa: () => ({ penyewa: [], penyewaLoading: true }) }
  };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: (name) => mocks[name] || (() => null), React: react, setTimeout: () => 0, clearTimeout: () => {} });
  return (nextMasters) => {
    masters = nextMasters;
    effects = [];
    module.exports.default({ open: true, count: 1, params, setParams: (update) => { params = update(params); }, onClose: () => {} });
    effects.forEach((fn) => fn());
    return { equipment_ids: Array.from(params.equipment_ids), page: params.page };
  };
}

const cabangReady = { data: [{ id: 1, area: 'QA-AREA' }], dataLoading: false };
const equipmentReady = { data: [{ id: 101, cabang_id: 1 }], dataLoading: false };
const loading = { data: [], dataLoading: true };

for (const first of ['equipment', 'cabang']) {
  test(`AC-BD-07 preserves selection when ${first} arrives first, then retains valid selection`, () => {
    const render = harness();
    assert.deepEqual(render({ cabang: loading, equipment: loading }), { equipment_ids: [101], page: 3 });
    assert.deepEqual(render({ cabang: first === 'cabang' ? cabangReady : loading, equipment: first === 'equipment' ? equipmentReady : loading }), { equipment_ids: [101], page: 3 });
    assert.deepEqual(render({ cabang: cabangReady, equipment: equipmentReady }), { equipment_ids: [101], page: 3 });
  });
}

test('AC-BD-07 defers invalid-selection cleanup until cabang finishes, including stale options', () => {
  const render = harness();
  const otherArea = [{ id: 1, area: 'OTHER' }];
  assert.deepEqual(render({ cabang: { data: otherArea, dataLoading: true }, equipment: equipmentReady }), { equipment_ids: [101], page: 3 });
  assert.deepEqual(render({ cabang: { data: otherArea, dataLoading: false }, equipment: equipmentReady }), { equipment_ids: [], page: 1 });
});

test('AC-BD-07 removes equipment missing from a loaded nonempty master', () => {
  const render = harness();
  assert.deepEqual(render({ cabang: cabangReady, equipment: { data: [{ id: 102, cabang_id: 1 }], dataLoading: false } }), { equipment_ids: [], page: 1 });
});
