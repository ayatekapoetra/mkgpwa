const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const base = 'src/views/scm/order-payment/';
const filesToCompile = [
  'src/api/order-payments.js',
  base + 'AddItemDialog.js',
  base + 'outstanding-modal.js',
  base + 'detail.js',
];

const compiled = Promise.all(
  filesToCompile.map(async (file) => [
    file,
    (
      await transform(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
        filename: file,
        jsc: {
          parser: { syntax: 'ecmascript', jsx: true },
          transform: { react: { runtime: 'classic' } },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      })
    ).code,
  ])
).then(Object.fromEntries);

test('fetchDebitCoas supports both paymentId and standalone bisnis_id params', async () => {
  const source = await compiled;
  const requests = [];
  const fakeAxios = {
    get: async (url, config) => {
      requests.push({ url, config });
      return { data: { rows: [{ id: 101, kode: '6101', name: 'Biaya Bank' }] } };
    },
    post: async () => ({ data: {} }),
  };

  const module = { exports: {} };
  vm.runInNewContext(source['src/api/order-payments.js'], {
    module,
    exports: module.exports,
    require(name) {
      if (name === 'utils/axios') return { __esModule: true, default: fakeAxios };
      if (name === 'swr') return { __esModule: true, default: () => ({}) };
      if (name === 'react') return React;
      assert.fail(`Unexpected dependency ${name}`);
    },
  });

  const { fetchDebitCoas } = module.exports;

  // Case 1: call with integer ID
  const res1 = await fetchDebitCoas(42);
  assert.equal(requests[0].url, '/scm/order-payments/42/debit-coas');
  assert.deepEqual(res1, [{ id: 101, kode: '6101', name: 'Biaya Bank' }]);

  // Case 2: call with object params { bisnis_id: 9 }
  const res2 = await fetchDebitCoas({ bisnis_id: 9 });
  assert.equal(requests[1].url, '/scm/order-payments/debit-coas');
  assert.deepEqual(requests[1].config.params, { bisnis_id: 9 });
  assert.deepEqual(res2, [{ id: 101, kode: '6101', name: 'Biaya Bank' }]);

  // Case 3: call with ID and extra params
  await fetchDebitCoas(42, { search: 'admin' });
  assert.equal(requests[2].url, '/scm/order-payments/42/debit-coas');
  assert.deepEqual(requests[2].config.params, { search: 'admin' });
});

test('detail.js displays po_narasi and PO info when available on item', async () => {
  const source = await compiled;
  const DetailCode = source[base + 'detail.js'];

  // Verify po_narasi text exists in compiled code
  assert.ok(DetailCode.includes('po_narasi'), 'detail.js must contain reference to po_narasi');
  assert.ok(DetailCode.includes('PO & Keterangan'), 'detail.js must render PO & Keterangan field');
});

test('outstanding-modal.js displays po_narasi under PO column', async () => {
  const source = await compiled;
  const ModalCode = source[base + 'outstanding-modal.js'];

  assert.ok(ModalCode.includes('po_narasi'), 'outstanding-modal.js must render po_narasi');
});

test('AddItemDialog.js includes Debit COA mode, validation, and onAddLocal support', async () => {
  const source = await compiled;
  const DialogCode = source[base + 'AddItemDialog.js'];

  assert.ok(DialogCode.includes('coa_debit'), 'AddItemDialog must manage coa_debit');
  assert.ok(DialogCode.includes('fetchDebitCoas'), 'AddItemDialog must import fetchDebitCoas');
  assert.ok(DialogCode.includes('onAddLocal'), 'AddItemDialog must handle draft onAddLocal callback');
});
