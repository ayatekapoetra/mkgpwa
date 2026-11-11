const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transform } = require('next/dist/build/swc');

const root = path.resolve(__dirname, '..');

async function compile(relative) {
  const { code } = await transform(fs.readFileSync(path.join(root, relative), 'utf8'), {
    filename: relative,
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'classic' } },
      target: 'es2022'
    },
    module: { type: 'commonjs' }
  });
  return code;
}

function loadModule(code, mocks = {}) {
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    require: (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
    console,
    URLSearchParams,
    Intl,
    process: { env: {} }
  });
  return mod.exports;
}

test('faktur pembelian API builds detail/plans endpoints and normalizes permissions', async () => {
  const calls = [];
  const fakeAxios = {
    get: async (...args) => { calls.push(['get', ...args]); return { data: { rows: [] } }; },
    post: async (...args) => {
      calls.push(['post', ...args]);
      return { data: { diagnostic: { error: false }, rows: { created: [], failed: [] } } };
    }
  };

  const api = loadModule(await compile('src/api/faktur-pembelian.js'), {
    react: { useMemo: (fn) => fn() },
    swr: { __esModule: true, default: () => ({ data: null }) },
    'utils/axios': { __esModule: true, default: fakeAxios, fetcher: async () => ({}) }
  });

  assert.equal(api.endpoints.key, '/scm/faktur-pembelian');
  assert.equal(api.endpoints.unpaid, '/scm/faktur-pembelian/unpaid');
  assert.equal(api.endpoints.plans, '/scm/faktur-pembelian/plans');
  assert.equal(api.endpoints.detail(42), '/scm/faktur-pembelian/42');

  await api.createPaymentPlans({ allocations: [{ faktur_id: 1 }] });
  const post = calls.find((c) => c[0] === 'post');
  assert.equal(post[1], '/scm/faktur-pembelian/plans');
  assert.equal(post[3].skipOfflineQueue, true);
  assert.equal(post[3].skipRetry, true);
});

test('faktur pembelian API surfaces diagnostic errors from plans endpoint', async () => {
  const fakeAxios = {
    get: async () => ({ data: {} }),
    post: async () => {
      const err = new Error('request failed');
      err.response = { data: { diagnostic: { error: 'Faktur sudah punya rencana pembayaran' }, rows: { failed: [{ message: 'x' }] } } };
      throw err;
    }
  };

  const api = loadModule(await compile('src/api/faktur-pembelian.js'), {
    react: { useMemo: (fn) => fn() },
    swr: { __esModule: true, default: () => ({ data: null }) },
    'utils/axios': { __esModule: true, default: fakeAxios, fetcher: async () => ({}) }
  });

  await assert.rejects(
    api.createPaymentPlans({ allocations: [{ faktur_id: 1 }] }),
    (err) => {
      assert.match(err.message, /sudah punya rencana pembayaran/);
      assert.deepEqual(err.payload.failed, [{ message: 'x' }]);
      return true;
    }
  );
});

test('faktur pembelian utils expose money/date/status helpers', async () => {
  const utils = loadModule(await compile('src/views/scm/faktur-pembelian/utils.js'), {
    moment: Object.assign(require('moment'), { locale: () => {} }),
    'moment/locale/id': {}
  });

  assert.equal(utils.money(1500000), '1.500.000');
  assert.equal(utils.formatDate('2026-11-04'), '04 Nov 2026');
  assert.equal(utils.TOP_TYPE_LABELS.INSTALLMENT, 'Termin');
  assert.equal(utils.INSTALLMENT_LABELS.AWAITING_DELIVERY, 'Menunggu Barang');
  assert.ok(utils.STATUS_OPTIONS.some((o) => o.value === 'unpaid'));
  assert.equal(utils.buildDefaultFilters().status, 'unpaid');
  assert.match(
    utils.agingLabel({ is_overdue: true, aging_days: 12, due_date: '2026-10-01' }),
    /Lewat 12 hari/
  );
  assert.match(utils.agingLabel({ planned: true, planned_kdbayar: 'PAY/1' }), /PAY\/1/);
});

test('faktur pembelian module files exist for routes and views', () => {
  const required = [
    'src/app/(dashboard)/(chasier)/faktur-pembelian/page.js',
    'src/app/(dashboard)/(chasier)/faktur-pembelian/[id]/page.js',
    'src/views/scm/faktur-pembelian/index.js',
    'src/views/scm/faktur-pembelian/list.js',
    'src/views/scm/faktur-pembelian/filter.js',
    'src/views/scm/faktur-pembelian/detail.js',
    'src/views/scm/faktur-pembelian/utils.js',
    'src/api/faktur-pembelian.js'
  ];
  for (const file of required) {
    assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
  }
});

test('order payment create no longer requires a wallet for draft submission', () => {
  const source = fs.readFileSync(path.join(root, 'src/views/scm/order-payment/create.js'), 'utf8');
  assert.match(source, /canSubmitBase/);
  assert.match(source, /const canPost = canSubmitBase && Boolean\(walletId\)/);
  assert.doesNotMatch(source, /disabled=\{saving \|\| !canSubmit\}\s*\n\s*onClick=\{\(\) => submit\(true\)\}/);
});

test('faktur pembelian API exposes updateFakturPembelian PUT to detail endpoint', async () => {
  const calls = [];
  const fakeAxios = {
    get: async () => ({ data: { rows: [] } }),
    put: async (...args) => {
      calls.push(['put', ...args]);
      return { data: { diagnostic: { error: false }, rows: { header: { id: 93 } } } };
    }
  };

  const api = loadModule(await compile('src/api/faktur-pembelian.js'), {
    react: { useMemo: (fn) => fn() },
    swr: { __esModule: true, default: () => ({ data: null }) },
    'utils/axios': { __esModule: true, default: fakeAxios, fetcher: async () => ({}) }
  });

  const result = await api.updateFakturPembelian(93, { kode: 'INV/1', date_faktur: '2026-11-05' });
  const put = calls.find((c) => c[0] === 'put');
  assert.equal(put[1], '/scm/faktur-pembelian/93');
  assert.equal(put[3].skipOfflineQueue, true);
  assert.equal(put[3].skipRetry, true);
  assert.equal(result.header.id, 93);
});

test('faktur pembelian list renders a Detail action per row', async () => {
  const code = await compile('src/views/scm/faktur-pembelian/list.js');
  assert.match(code, /faktur-pembelian\/\$\{row\.id\}/);
  assert.match(code, /Detail/);
});
