const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const compiled = transform(fs.readFileSync(path.resolve(__dirname, '../src/views/master/barang/create.js'), 'utf8'), {
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' },
  module: { type: 'commonjs' }
});

function walk(node) {
  return React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(walk)] : [];
}

async function fixture({ edit = false, offline = false } = {}) {
  const calls = [];
  const queued = [];
  const navigation = [];
  const react = { ...React, useState: initial => [initial, () => {}] };
  const module = { exports: {} };
  vm.runInNewContext((await compiled).code, {
    module, exports: module.exports, React, navigator: { onLine: !offline },
    require(name) {
      if (name === 'react') return react;
      if (name === 'next/link') return 'NextLink';
      if (name === 'next/navigation') return { useParams: () => ({ id: 9 }), useRouter: () => ({ push: value => navigation.push(value) }) };
      if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
      if (name === '@mui/material/styles') return { alpha: value => value, useTheme: () => ({ palette: { primary: { main: '#4680ff' }, info: { main: '#00aaff' }, warning: { main: '#ff9900' }, background: { paper: '#fff' } } }) };
      if (name === 'iconsax-react') return new Proxy({}, { get: () => () => null });
      if (name === 'formik') return { Form: 'form', Formik: 'Formik' };
      if (name === 'yup') return require('yup');
      if (name === 'utils/axios') return { __esModule: true, default: async config => { calls.push(config); return { data: { diagnostic: { error: false } } }; } };
      if (name === 'api/notification') return { openNotification() {} };
      if (name === 'api/barang') return { useBarangFilterOptions: () => ({ options: {} }), useShowBarang: () => ({ data: { id: 9, kode: 'LEGACY-9', nama: 'Existing', satuan: 'PCS' } }) };
      if (name === 'lib/offlineFetch') return { saveRequest: async config => queued.push(config) };
      if (name === 'config') return { APP_DEFAULT_PATH: '/home' };
      if (name.startsWith('components/')) return name;
      assert.fail(`Unexpected dependency ${name}`);
    }
  });
  const tree = module.exports.default({ edit });
  const form = walk(tree).find(node => node.type === 'Formik').props;
  const values = { ...form.initialValues, nama: ' Filter ', satuan: 'PCS', stn_pakai: 'PCS', kategori_id: 1, application_id: 2, manufacture_id: 3, brand_id: 4 };
  const fields = () => walk(form.children({ values, errors: {}, touched: {}, setFieldValue() {}, setFieldTouched() {} }));
  return { form, fields, values, calls, queued, navigation };
}

test('create validates four classifications, not a manually entered kode', async () => {
  const f = await fixture();
  await f.form.validationSchema.validate({ ...f.values, kode: '' });
  for (const field of ['kategori_id', 'application_id', 'manufacture_id', 'brand_id']) {
    await assert.rejects(f.form.validationSchema.validate({ ...f.values, [field]: '' }), error => error.path === field);
  }
})

test('create kode input is read-only, and all four classification selectors are required', async () => {
  const f = await fixture();
  const fields = f.fields();
  const kode = fields.find(node => node.type === 'TextField' && node.props.name === 'kode').props;
  assert.equal(kode.InputProps.readOnly, true);
  assert.equal(kode.required, false);
  assert.equal(kode.placeholder, 'Otomatis saat disimpan');
  const classificationFields = fields.filter(node => typeof node.type === 'function' && node.type.name === 'RelationField');
  assert.equal(classificationFields.length, 4);
  assert.ok(classificationFields.every(node => node.props.required));
})

test('online create omits client kode and submits classification IDs for server generation', async () => {
  const f = await fixture();
  let submitting;
  await f.form.onSubmit({ ...f.values, kode: 'CLIENT-MANUAL' }, { setSubmitting: value => { submitting = value; } });
  assert.equal(f.calls[0].url, '/api/master/barang/create');
  assert.equal(Object.hasOwn(f.calls[0].data, 'kode'), false);
  assert.equal(f.calls[0].data.nama, 'Filter');
  for (const field of ['kategori_id', 'application_id', 'manufacture_id', 'brand_id']) assert.equal(f.calls[0].data[field], f.values[field]);
  assert.deepEqual(f.navigation, ['/barang']);
  assert.equal(submitting, false);
})

test('offline queue stores classifications without reserving or reusing a client-generated code', async () => {
  const f = await fixture({ offline: true });
  await f.form.onSubmit(f.values, { setSubmitting() {} });
  assert.equal(f.calls.length, 0);
  assert.equal(f.queued.length, 1);
  assert.equal(Object.hasOwn(f.queued[0].data, 'kode'), false);
  assert.equal(f.queued[0].data.brand_id, 4);
  assert.equal(f.navigation.length, 0);
})

test('edit retains its existing code contract and accepts legacy unclassified records', async () => {
  const f = await fixture({ edit: true });
  await f.form.validationSchema.validate(f.form.initialValues);
  await assert.rejects(f.form.validationSchema.validate({ ...f.form.initialValues, kode: '' }), error => error.path === 'kode');
  const kode = f.fields().find(node => node.type === 'TextField' && node.props.name === 'kode').props;
  assert.equal(kode.InputProps.readOnly, false);
  await f.form.onSubmit(f.form.initialValues, { setSubmitting() {} });
  assert.equal(f.calls[0].url, '/api/master/barang/9/update');
  assert.equal(f.calls[0].data.kode, 'LEGACY-9');
})
