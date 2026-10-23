const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const hookFile = 'src/hooks/useFilterStorage.js';

let compiledCode;
async function getCompiled() {
  if (!compiledCode) {
    const raw = fs.readFileSync(path.resolve(__dirname, '..', hookFile), 'utf8');
    const res = await transform(raw, {
      filename: hookFile,
      jsc: {
        parser: { syntax: 'ecmascript' },
        target: 'es2022'
      },
      module: { type: 'commonjs' }
    });
    compiledCode = res.code;
  }
  return compiledCode;
}

function createMockEnv({ windowDefined = true, sharedStore = null, initialStorage = {} } = {}) {
  const store = sharedStore || new Map(Object.entries(initialStorage));

  const mockLocalStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    get _store() {
      return store;
    }
  };

  const windowObj = windowDefined
    ? {
        localStorage: mockLocalStorage
      }
    : undefined;

  let stateSlot = undefined;
  let refSlot = undefined;

  const mockReact = {
    useState(initial) {
      if (stateSlot === undefined) {
        stateSlot = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (updater) => {
        stateSlot = typeof updater === 'function' ? updater(stateSlot) : updater;
      };
      return [stateSlot, setState];
    },
    useCallback(fn) {
      return fn;
    },
    useRef(initial) {
      if (refSlot === undefined) {
        refSlot = { current: initial };
      }
      return refSlot;
    },
    useEffect(effect) {
      effect();
    }
  };

  return {
    windowObj,
    mockLocalStorage,
    mockReact,
    getState: () => stateSlot
  };
}

async function loadHook(env) {
  const code = await getCompiled();
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require(name) {
      if (name === 'react') return env.mockReact;
      throw new Error(`Unexpected import: ${name}`);
    },
    console
  };

  if (env.windowObj !== undefined) {
    sandbox.window = env.windowObj;
    sandbox.localStorage = env.windowObj.localStorage;
  }

  vm.runInNewContext(code, sandbox);
  return module.exports;
}

test('AC-01: useFilterStorage is exported properly as named and default export', async () => {
  const env = createMockEnv();
  const mod = await loadHook(env);
  assert.equal(typeof mod.useFilterStorage, 'function');
  assert.equal(typeof mod.default, 'function');
  assert.equal(mod.useFilterStorage, mod.default);
});

test('AC-01: SSR-safe - returns default filters when window is undefined', async () => {
  const env = createMockEnv({ windowDefined: false });
  const mod = await loadHook(env);
  const defaults = { status: 'all', page: 1, keyword: '' };
  const [filters] = mod.useFilterStorage('test_key', defaults);
  assert.deepEqual(filters, defaults);
});

test('AC-02 / AC-04: restores filters from localStorage and resets page to 1', async () => {
  const env = createMockEnv({
    windowDefined: true,
    initialStorage: {
      mkg_filter_test: JSON.stringify({ status: 'active', keyword: 'excavator', page: 5 })
    }
  });
  const mod = await loadHook(env);
  const defaults = { status: 'all', page: 1, keyword: '', newField: 'defaultVal' };
  const [filters] = mod.useFilterStorage('mkg_filter_test', defaults);

  assert.equal(filters.status, 'active');
  assert.equal(filters.keyword, 'excavator');
  assert.equal(filters.newField, 'defaultVal', 'merges defaults for schema evolution');
  assert.equal(filters.page, 1, 'AC-06: page is always reset to 1');
});

test('AC-01: handles corrupt JSON in localStorage without throwing', async () => {
  const env = createMockEnv({
    windowDefined: true,
    initialStorage: {
      mkg_filter_test: 'corrupt-not-json{{{'
    }
  });
  const mod = await loadHook(env);
  const defaults = { status: 'all', page: 1 };
  const [filters] = mod.useFilterStorage('mkg_filter_test', defaults);
  assert.deepEqual(filters, defaults);
});

test('AC-03 & AC-06: setFilters updates state and persists without page field', async () => {
  const env = createMockEnv({ windowDefined: true });
  const mod = await loadHook(env);
  const defaults = { status: 'pending', page: 1, limit: 25 };
  const [, setFilters] = mod.useFilterStorage('mkg_filter_scm_po', defaults);

  setFilters({ status: 'approved', page: 3, limit: 50 });

  assert.equal(env.mockLocalStorage.getItem('mkg_filter_scm_po') !== null, true);
  const stored = JSON.parse(env.mockLocalStorage.getItem('mkg_filter_scm_po'));
  assert.equal(stored.status, 'approved');
  assert.equal(stored.limit, 50);
  assert.equal(stored.page, undefined, 'AC-06: page field must be omitted from stored localStorage');

  // React state retains page for in-session pagination
  const currentState = env.getState();
  assert.equal(currentState.page, 3);
  assert.equal(currentState.status, 'approved');
});

test('AC-05: resetFilters cleans up localStorage and resets to defaults', async () => {
  const env = createMockEnv({
    windowDefined: true,
    initialStorage: {
      mkg_filter_ops: JSON.stringify({ status: 'closed' })
    }
  });
  const mod = await loadHook(env);
  const defaults = { status: 'all', page: 1 };
  const [, , resetFilters] = mod.useFilterStorage('mkg_filter_ops', defaults);

  assert.equal(env.mockLocalStorage.getItem('mkg_filter_ops') !== null, true);
  resetFilters();

  assert.equal(env.mockLocalStorage.getItem('mkg_filter_ops'), null, 'AC-05: key removed from localStorage');
  const state = env.getState();
  assert.deepEqual(state, defaults);
});

test('AC-07: storage key isolation between different pages', async () => {
  const sharedMap = new Map();
  const env1 = createMockEnv({ windowDefined: true, sharedStore: sharedMap });
  const mod1 = await loadHook(env1);

  const [, setFilters1] = mod1.useFilterStorage('mkg_filter_scm_po', { page: 1, poNo: '' });
  setFilters1({ page: 1, poNo: 'PO-001' });

  const env2 = createMockEnv({ windowDefined: true, sharedStore: sharedMap });
  const mod2 = await loadHook(env2);
  const [filters2] = mod2.useFilterStorage('mkg_filter_scm_pr', { page: 1, prNo: '' });

  assert.equal(filters2.prNo, '');
  assert.equal(filters2.poNo, undefined);
  assert.equal(JSON.parse(sharedMap.get('mkg_filter_scm_po')).poNo, 'PO-001');
  assert.equal(sharedMap.has('mkg_filter_scm_pr'), false);
});

test('Functional updater support in setFilters', async () => {
  const env = createMockEnv({ windowDefined: true });
  const mod = await loadHook(env);
  const defaults = { status: 'all', page: 1 };
  const [, setFilters] = mod.useFilterStorage('mkg_filter_test_updater', defaults);

  setFilters((prev) => ({ ...prev, status: 'updated' }));
  const stored = JSON.parse(env.mockLocalStorage.getItem('mkg_filter_test_updater'));
  assert.equal(stored.status, 'updated');
});

test('Default filters factory function support', async () => {
  const env = createMockEnv({ windowDefined: true });
  const mod = await loadHook(env);
  const factory = () => ({ status: 'from_factory', page: 1 });
  const [filters] = mod.useFilterStorage('mkg_filter_test_factory', factory);
  assert.equal(filters.status, 'from_factory');
});

test('Reset with custom overrides support', async () => {
  const env = createMockEnv({
    windowDefined: true,
    initialStorage: {
      mkg_filter_test_override: JSON.stringify({ status: 'done', limit: 50 })
    }
  });
  const mod = await loadHook(env);
  const defaults = { status: 'all', limit: 25, page: 1 };
  const [, , resetFilters] = mod.useFilterStorage('mkg_filter_test_override', defaults);

  resetFilters({ limit: 100 });
  assert.equal(env.mockLocalStorage.getItem('mkg_filter_test_override'), null);
  const state = env.getState();
  assert.equal(state.status, 'all');
  assert.equal(state.limit, 100);
});

test('Verified standard key naming in migrated pages', () => {
  const timesheetSrc = fs.readFileSync(
    path.resolve(__dirname, '../src/views/operational/timesheet/index.js'),
    'utf8'
  );
  assert.match(timesheetSrc, /mkg_filter_operational_timesheet/);
  assert.match(timesheetSrc, /useFilterStorage\(/);

  const orderPaymentSrc = fs.readFileSync(
    path.resolve(__dirname, '../src/views/scm/order-payment/index.js'),
    'utf8'
  );
  assert.match(orderPaymentSrc, /mkg_filter_scm_order_payment/);
  assert.match(orderPaymentSrc, /useFilterStorage\(/);

  const crewWorkSrc = fs.readFileSync(
    path.resolve(__dirname, '../src/views/human-capital/crew-work-activity/index.js'),
    'utf8'
  );
  assert.match(crewWorkSrc, /mkg_filter_human_capital_crew_work_activity/);
  assert.match(crewWorkSrc, /useFilterStorage\(/);
});

test('Tahap 2: Verified standard key naming in 9 migrated SCM & Warehouse pages', () => {
  const pages = [
    { file: '../src/views/scm/purchasing-orders/index.js', key: 'mkg_filter_scm_purchasing_orders' },
    { file: '../src/views/scm/purchasing-request/index.js', key: 'mkg_filter_scm_purchasing_request' },
    { file: '../src/views/scm/goods-receipt/index.js', key: 'mkg_filter_scm_goods_receipt' },
    { file: '../src/views/scm/pickup-order/index.js', key: 'mkg_filter_scm_pickup_order' },
    { file: '../src/views/scm/delivery-order/index.js', key: 'mkg_filter_scm_delivery_order' },
    { file: '../src/views/scm/shipping-order/index.js', key: 'mkg_filter_scm_shipping_order' },
    { file: '../src/views/warehouse/goods-issues/index.js', key: 'mkg_filter_warehouse_goods_issues' },
    { file: '../src/views/warehouse/stokopname/index.js', key: 'mkg_filter_warehouse_stokopname' },
    { file: '../src/views/warehouse/transfers/index.js', key: 'mkg_filter_warehouse_transfers' },
  ];

  for (const page of pages) {
    const src = fs.readFileSync(path.resolve(__dirname, page.file), 'utf8');
    assert.match(src, new RegExp(page.key), `Page ${page.file} should use key ${page.key}`);
    assert.match(src, /useFilterStorage\(/, `Page ${page.file} should call useFilterStorage`);
    assert.match(src, /reset(Filters|Filtered|Params)/, `Page ${page.file} should wire reset handler`);
  }
});

test('Tahap 3: Verified standard key naming in 9 migrated Operational & Maintenance pages', () => {
  const pages = [
    { file: '../src/views/operational/daily-activity/index.js', key: 'mkg_filter_operational_daily_activity' },
    { file: '../src/views/operational/equipment-mobilization/index.js', key: 'mkg_filter_operational_equipment_mobilization' },
    { file: '../src/views/operational/rental-contract/index.js', key: 'mkg_filter_operational_rental_contract' },
    { file: '../src/views/operational/mining/daily-checker-pit/index.js', key: 'mkg_filter_operational_daily_checker_pit' },
    { file: '../src/views/operational/mining/daily-checker-stockpile/index.js', key: 'mkg_filter_operational_daily_checker_stockpile' },
    { file: '../src/views/operational/mining/fleet-assignment/FleetAssignmentWorkspace.js', key: 'mkg_filter_operational_fleet_assignment' },
    { file: '../src/views/operational/mining/mining-production-plan/index.js', key: 'mkg_filter_operational_mining_production_plan' },
    { file: '../src/views/maintenance/breakdown/index.js', key: 'mkg_filter_maintenance_breakdown' },
    { file: '../src/views/maintenance/work-order/index.js', key: 'mkg_filter_maintenance_work_order' },
  ];

  for (const page of pages) {
    const src = fs.readFileSync(path.resolve(__dirname, page.file), 'utf8');
    assert.match(src, new RegExp(page.key), `Page ${page.file} should use key ${page.key}`);
    assert.match(src, /useFilterStorage\(/, `Page ${page.file} should call useFilterStorage`);
    assert.match(src, /reset(Filters|Filtered|Params|Scope)/, `Page ${page.file} should wire reset handler`);
  }
});

test('Tahap 3: Verified onReset prop wiring in filter components', () => {
  const filterFiles = [
    '../src/views/operational/daily-activity/filter.js',
    '../src/views/operational/equipment-mobilization/filter.js',
    '../src/views/operational/rental-contract/filter.js',
    '../src/views/operational/mining/daily-checker-pit/filter.js',
    '../src/views/operational/mining/daily-checker-stockpile/filter.js',
    '../src/views/operational/mining/fleet-assignment/filter.js',
    '../src/views/operational/mining/mining-production-plan/filter.js',
  ];
  for (const file of filterFiles) {
    const src = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
    assert.match(src, /onReset/, `Filter component ${file} should support onReset`);
  }
});

test('Tahap 4: Verified standard key naming in 10 migrated Laporan pages', () => {
  const pages = [
    { file: '../src/views/laporan/monitoring-order-part/index.js', key: 'mkg_filter_laporan_monitoring_order_part' },
    { file: '../src/views/laporan/monitoring-sparepart-stock/index.js', key: 'mkg_filter_laporan_monitoring_sparepart_stock' },
    { file: '../src/views/laporan/monitoring-stock-sparepart/index.js', key: 'mkg_filter_laporan_monitoring_stock_sparepart' },
    { file: '../src/views/laporan/part-used-history/index.js', key: 'mkg_filter_laporan_part_used_history' },
    { file: '../src/views/laporan/event-history/index.js', key: 'mkg_filter_laporan_event_history' },
    { file: '../src/views/laporan/operating-history/index.js', key: 'mkg_filter_laporan_operating_history' },
    { file: '../src/views/laporan/productivity/index.js', key: 'mkg_filter_laporan_productivity' },
    { file: '../src/views/laporan/stokopname/index.js', key: 'mkg_filter_laporan_stokopname' },
    { file: '../src/views/laporan/summary-breakdown/index.js', key: 'mkg_filter_laporan_summary_breakdown' },
    { file: '../src/views/laporan/pemakaian-barang/index.js', key: 'mkg_filter_laporan_pemakaian_barang' },
  ];

  for (const page of pages) {
    const src = fs.readFileSync(path.resolve(__dirname, page.file), 'utf8');
    assert.match(src, new RegExp(page.key), `Page ${page.file} should use key ${page.key}`);
    assert.match(src, /useFilterStorage\(/, `Page ${page.file} should call useFilterStorage`);
    assert.match(src, /reset(Filters|Filtered|Params)/, `Page ${page.file} should wire reset handler`);
  }
});

test('Tahap 4: Verified standard key naming in 11 migrated Master pages', () => {
  const pages = [
    { file: '../src/views/master/barang/index.js', key: 'mkg_filter_master_barang' },
    { file: '../src/views/master/cabang/index.js', key: 'mkg_filter_master_cabang' },
    { file: '../src/views/master/dom/index.js', key: 'mkg_filter_master_dom' },
    { file: '../src/views/master/equipment/index.js', key: 'mkg_filter_master_equipment' },
    { file: '../src/views/master/harga-beli/index.js', key: 'mkg_filter_master_harga_beli' },
    { file: '../src/views/master/kegiatan-kerja/index.js', key: 'mkg_filter_master_kegiatan_kerja' },
    { file: '../src/views/master/lokasi-kerja/index.js', key: 'mkg_filter_master_lokasi_kerja' },
    { file: '../src/views/master/material/index.js', key: 'mkg_filter_master_material' },
    { file: '../src/views/master/pemasok/index.js', key: 'mkg_filter_master_pemasok' },
    { file: '../src/views/master/penyewa/index.js', key: 'mkg_filter_master_penyewa' },
    { file: '../src/views/master/unit-bisnis/index.js', key: 'mkg_filter_master_unit_bisnis' },
  ];

  for (const page of pages) {
    const src = fs.readFileSync(path.resolve(__dirname, page.file), 'utf8');
    assert.match(src, new RegExp(page.key), `Page ${page.file} should use key ${page.key}`);
    assert.match(src, /useFilterStorage\(/, `Page ${page.file} should call useFilterStorage`);
    assert.match(src, /reset(Filters|Filtered|Params)/, `Page ${page.file} should wire reset handler`);
  }
});

test('Tahap 4: Verified onReset prop wiring in filter components', () => {
  const filterFiles = [
    '../src/views/laporan/event-history/filter.js',
    '../src/views/laporan/operating-history/filter.js',
    '../src/views/laporan/summary-breakdown/filter.js',
    '../src/views/laporan/pemakaian-barang/filter.js',
    '../src/views/master/barang/filter.js',
    '../src/views/master/cabang/filter.js',
    '../src/views/master/dom/filter.js',
    '../src/views/master/equipment/filter.js',
    '../src/views/master/harga-beli/filter.js',
    '../src/views/master/kegiatan-kerja/filter.js',
    '../src/views/master/lokasi-kerja/filter.js',
    '../src/views/master/material/filter.js',
    '../src/views/master/pemasok/filter.js',
    '../src/views/master/penyewa/filter.js',
    '../src/views/master/unit-bisnis/filter.js',
  ];
  for (const file of filterFiles) {
    const src = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
    assert.match(src, /onReset/, `Filter component ${file} should support onReset`);
  }
});



