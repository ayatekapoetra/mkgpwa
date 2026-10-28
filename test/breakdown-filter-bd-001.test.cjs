const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const utilsFile = 'src/views/maintenance/breakdown/utils.js';
const hookFile = 'src/hooks/useFilterStorage.js';
const apiFile = 'src/api/daily-breakdown-form.js';

async function loadUtils() {
  const code = (await transform(
    fs.readFileSync(path.resolve(__dirname, '..', utilsFile), 'utf8'),
    { filename: utilsFile, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } }
  )).code;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    console,
    require: (mod) => require(mod)
  });
  return module.exports;
}

test('BREAKDOWN_STATUS and ALL_BREAKDOWN_STATUSES include status 2 (Wait Services)', async () => {
  const utils = await loadUtils();
  const { BREAKDOWN_STATUS, ALL_BREAKDOWN_STATUSES, getStatusInfo } = utils;

  assert.ok(Array.isArray(BREAKDOWN_STATUS), 'BREAKDOWN_STATUS should be an array');
  assert.ok(Array.isArray(ALL_BREAKDOWN_STATUSES), 'ALL_BREAKDOWN_STATUSES should be an array');

  assert.deepEqual([...ALL_BREAKDOWN_STATUSES], [0, 1, 2, 8, 9]);

  const waitServices = BREAKDOWN_STATUS.find((s) => s.code === 2);
  assert.ok(waitServices, 'Status 2 should exist in BREAKDOWN_STATUS');
  assert.equal(waitServices.label, 'Wait Services');

  const statusInfo = getStatusInfo(2);
  assert.equal(statusInfo.label, 'Wait Services');
  assert.ok(statusInfo.bg, 'Status 2 should have bg color');
  assert.equal(statusInfo.muiColor, 'secondary');
});

test('buildCompactParams handles status arrays and backend query rules correctly', async () => {
  const utils = await loadUtils();
  const { buildCompactParams, ALL_BREAKDOWN_STATUSES } = utils;

  // 1. When status is empty array, default to all statuses (0,1,2,8,9) to avoid backend dropping status 9
  const emptyRes = buildCompactParams({ status: [] });
  assert.equal(emptyRes.status, '0,1,2,8,9');

  // 2. When status contains all breakdown statuses, status is '0,1,2,8,9'
  const allRes = buildCompactParams({ status: [...ALL_BREAKDOWN_STATUSES] });
  assert.equal(allRes.status, '0,1,2,8,9');

  // 3. When specific statuses are selected, joined by comma
  const filteredRes = buildCompactParams({ status: [0, 2] });
  assert.equal(filteredRes.status, '0,2');

  const singleRes = buildCompactParams({ status: [2] });
  assert.equal(singleRes.status, '2');

  // 4. Other empty fields are omitted
  const mixedRes = buildCompactParams({
    cabang_id: '5',
    equipment_id: '',
    search: '   ',
    page: 2,
    status: [1, 8]
  });
  assert.equal(mixedRes.cabang_id, '5');
  assert.equal(mixedRes.equipment_id, undefined);
  assert.equal(mixedRes.search, undefined);
  assert.equal(mixedRes.page, 2);
  assert.equal(mixedRes.status, '1,8');
});

test('SWR options in daily-breakdown-form.js have keepPreviousData and revalidateIfStale', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '..', apiFile), 'utf8');

  assert.match(content, /revalidateIfStale:\s*true/, 'revalidateIfStale: true must be present in SWR configuration');
  assert.match(content, /keepPreviousData:\s*true/, 'keepPreviousData: true must be present in SWR configuration');
});

test('useFilterStorage handles SSR safety and storage interactions', async () => {
  const hookCode = (await transform(
    fs.readFileSync(path.resolve(__dirname, '..', hookFile), 'utf8'),
    { filename: hookFile, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } }
  )).code;

  // Verify SSR safety when window is undefined
  const moduleSSR = { exports: {} };
  const mockReact = {
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useEffect: () => {},
    useRef: (val) => ({ current: val }),
    useCallback: (fn) => fn
  };
  vm.runInNewContext(hookCode, {
    module: moduleSSR,
    exports: moduleSSR.exports,
    React: mockReact,
    require: (mod) => (mod === 'react' ? mockReact : require(mod)),
    console
  });

  const useFilterStorageSSR = moduleSSR.exports.default || moduleSSR.exports;
  assert.equal(typeof useFilterStorageSSR, 'function');

  // Verify browser storage simulation
  const mockStorage = new Map();
  const windowMock = {
    sessionStorage: {
      getItem: (key) => mockStorage.get(key) || null,
      setItem: (key, val) => mockStorage.set(key, String(val)),
      removeItem: (key) => mockStorage.delete(key)
    }
  };

  const moduleBrowser = { exports: {} };
  let currentState;
  const mockReactBrowser = {
    useState: (init) => {
      currentState = typeof init === 'function' ? init() : init;
      const setter = (updater) => {
        currentState = typeof updater === 'function' ? updater(currentState) : updater;
      };
      return [currentState, setter];
    },
    useEffect: (effect) => effect(),
    useRef: (val) => ({ current: val }),
    useCallback: (fn) => fn
  };

  vm.runInNewContext(hookCode, {
    module: moduleBrowser,
    exports: moduleBrowser.exports,
    window: windowMock,
    React: mockReactBrowser,
    require: (mod) => (mod === 'react' ? mockReactBrowser : require(mod)),
    console
  });

  const useFilterStorageBrowser = moduleBrowser.exports.default || moduleBrowser.exports;
  const defaultVal = { cabang_id: '', status: [0, 1, 2, 8, 9] };
  const [val, setVal, resetVal] = useFilterStorageBrowser('mkg_filter_daily_breakdown', defaultVal, { storage: 'session' });

  assert.deepEqual(val, defaultVal);
  setVal({ cabang_id: '10', status: [2] });
  assert.equal(mockStorage.get('mkg_filter_daily_breakdown'), JSON.stringify({ cabang_id: '10', status: [2] }));

  resetVal();
  assert.equal(windowMock.sessionStorage.getItem('mkg_filter_daily_breakdown'), null);
});

test('Dependent filter cascading: cabang change resets invalid equipment and lokasi', () => {
  const masters = {
    cabangs: [{ id: 1, nama: 'Site A' }, { id: 2, nama: 'Site B' }],
    equipments: [
      { id: 101, nama: 'Excavator 1', cabang_id: 1 },
      { id: 102, nama: 'Dump Truck 1', cabang_id: 2 }
    ],
    lokasis: [
      { id: 201, nama: 'Pit North', cabang_id: 1 },
      { id: 202, nama: 'Pit South', cabang_id: 2 }
    ]
  };

  // Helper simulating the onChange in FilterDrawer
  function onCabangChange(prev, newCabangId) {
    const eqValid = !prev.equipment_id || (newCabangId ? (masters.equipments || []).some(
      (eq) => String(eq.id) === String(prev.equipment_id) && String(eq.cabang_id || eq?.cabang?.id || '') === newCabangId
    ) : true);

    const locValid = !prev.lokasi_id || (newCabangId ? (masters.lokasis || []).some(
      (loc) => String(loc.id) === String(prev.lokasi_id) && String(loc.cabang_id || loc?.cabang?.id || '') === newCabangId
    ) : true);

    return {
      ...prev,
      cabang_id: newCabangId,
      equipment_id: eqValid ? prev.equipment_id : '',
      lokasi_id: locValid ? prev.lokasi_id : ''
    };
  }

  // 1. Initial state with Site A, Excavator 1, Pit North
  const initial = { cabang_id: '1', equipment_id: 101, lokasi_id: 201 };

  // 2. Switching to Site B should reset equipment_id and lokasi_id because they belong to Site A
  const switched = onCabangChange(initial, '2');
  assert.equal(switched.cabang_id, '2');
  assert.equal(switched.equipment_id, '');
  assert.equal(switched.lokasi_id, '');

  // 3. Setting equipment from Site B
  const validForSiteB = { ...switched, equipment_id: 102, lokasi_id: 202 };
  // Keeping Site B retains them
  const kept = onCabangChange(validForSiteB, '2');
  assert.equal(kept.equipment_id, 102);
  assert.equal(kept.lokasi_id, 202);

  // 4. Clearing Cabang keeps selection or allows any
  const cleared = onCabangChange(validForSiteB, '');
  assert.equal(cleared.cabang_id, '');
  assert.equal(cleared.equipment_id, 102);
  assert.equal(cleared.lokasi_id, 202);
});
