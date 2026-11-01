const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transform } = require('next/dist/build/swc');

async function loadRequestItemsFields() {
  const filePath = path.resolve(__dirname, '../src/views/scm/purchasing-request/components/RequestItemsFields.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const compiled = await transform(fileContent, {
    filename: 'RequestItemsFields.js',
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'classic' } },
      target: 'es2022',
    },
    module: { type: 'commonjs' },
  });

  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    module,
    exports: module.exports,
    require(name) {
      if (name === 'react') return { useState: () => [null, () => {}], useMemo: (fn) => fn() };
      if (name === 'formik') return { FieldArray: () => null };
      if (name === '@mui/material') return new Proxy({}, { get: () => () => null });
      if (name === 'iconsax-react') return new Proxy({}, { get: () => () => null });
      if (name === './SparepartInfoPanel') return () => null;
      if (name === 'api/purchasing-request') return { usePurchasingRequestBarangSearch: () => ({ rows: [] }) };
      if (name === '../utils') return {
        getBarangOptionLabel: () => '',
        getBarangPrimaryCode: () => '',
        getBarangSearchText: () => '',
        getRelationName: () => '',
        getSelectedOption: () => null,
      };
      assert.fail(`Unexpected dependency: ${name}`);
    },
  });

  return module.exports;
}

async function loadPurchasingRequestForm() {
  const filePath = path.resolve(__dirname, '../src/views/scm/purchasing-request/form.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const compiled = await transform(fileContent, {
    filename: 'form.js',
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'classic' } },
      target: 'es2022',
    },
    module: { type: 'commonjs' },
  });

  const module = { exports: {} };
  vm.runInNewContext(compiled.code, {
    module,
    exports: module.exports,
    require(name) {
      if (name === 'react') return { useMemo: (fn) => fn() };
      if (name === 'formik') return { Formik: () => null };
      if (name === 'yup') return require('yup');
      if (name === '@mui/material') return new Proxy({}, { get: () => () => null });
      if (name === 'api/purchasing-request') return {};
      if (name === 'api/notification') return { openNotification: () => {} };
      if (name === './components') return {
        EMPTY_REQUEST_ITEM: { currency: 'IDR', kurs: 1 },
        RequestHeaderFields: () => null,
        RequestItemsFields: () => null,
      };
      assert.fail(`Unexpected dependency: ${name}`);
    },
  });

  return module.exports;
}

test('EMPTY_REQUEST_ITEM in RequestItemsFields has default currency IDR and kurs 1', async () => {
  const { EMPTY_REQUEST_ITEM } = await loadRequestItemsFields();

  assert.ok(EMPTY_REQUEST_ITEM, 'EMPTY_REQUEST_ITEM must be defined and exported');
  assert.equal(EMPTY_REQUEST_ITEM.currency, 'IDR');
  assert.equal(EMPTY_REQUEST_ITEM.kurs, 1);
  assert.equal(EMPTY_REQUEST_ITEM.qty_req, 1);
});

test('serializeRequestPayload sets default currency IDR and kurs 1 when missing', async () => {
  const { serializeRequestPayload } = await loadPurchasingRequestForm();

  assert.equal(typeof serializeRequestPayload, 'function');

  const payload = serializeRequestPayload({
    bisnis_id: 1,
    items: [
      {
        barang_id: 10,
        barang: { id: 10, nama: 'Filter' },
        equipment: { id: 1, kode: 'EX-01' },
        qty_req: 2,
        stn: 'PCS',
        description: 'Filter solar',
      },
      {
        barang_id: 11,
        qty_req: 1,
        stn: 'PCS',
        currency: '',
        kurs: null,
      },
    ],
  });

  assert.equal(payload.status, 'draft');
  assert.equal(payload.items.length, 2);

  // Objects should be stripped
  assert.equal(payload.items[0].barang, undefined);
  assert.equal(payload.items[0].equipment, undefined);

  // Defaults applied
  assert.equal(payload.items[0].currency, 'IDR');
  assert.equal(payload.items[0].kurs, 1);
  assert.equal(payload.items[1].currency, 'IDR');
  assert.equal(payload.items[1].kurs, 1);
});

test('serializeRequestPayload preserves explicit currency and kurs', async () => {
  const { serializeRequestPayload } = await loadPurchasingRequestForm();

  const payload = serializeRequestPayload({
    items: [
      {
        barang_id: 20,
        qty_req: 1,
        currency: 'USD',
        kurs: 16250,
      },
    ],
  });

  assert.equal(payload.items[0].currency, 'USD');
  assert.equal(payload.items[0].kurs, 16250);
});
