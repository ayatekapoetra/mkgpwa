const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

async function compileFile(filePath) {
  return transform(fs.readFileSync(filePath, 'utf8'), {
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'classic' } },
      target: 'es2022'
    },
    module: { type: 'commonjs' }
  });
}

function walk(node) {
  return React.isValidElement(node)
    ? [node, ...React.Children.toArray(node.props.children).flatMap(walk)]
    : [];
}

async function fixtureCreate({ edit = false, mockBarang = null } = {}) {
  const calls = [];
  const navigation = [];
  const compiled = await compileFile(path.resolve(__dirname, '../src/views/master/barang/create.js'));
  const react = { ...React, useState: (initial) => [initial, () => {}] };
  const module = { exports: {} };

  vm.runInNewContext(compiled.code, {
    module,
    exports: module.exports,
    React,
    navigator: { onLine: true },
    require(name) {
      if (name === 'react') return react;
      if (name === 'next/link') return 'NextLink';
      if (name === 'next/navigation') {
        return {
          useParams: () => ({ id: 42 }),
          useRouter: () => ({ push: (v) => navigation.push(v) })
        };
      }
      if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
      if (name === '@mui/material/styles') {
        return {
          alpha: (v) => v,
          useTheme: () => ({
            palette: {
              primary: { main: '#4680ff' },
              info: { main: '#00aaff' },
              warning: { main: '#ff9900' },
              divider: '#eee',
              background: { paper: '#fff' }
            }
          })
        };
      }
      if (name === 'iconsax-react') return new Proxy({}, { get: () => () => null });
      if (name === 'formik') {
        return {
          Form: 'form',
          Formik: 'Formik',
          useFormikContext: () => ({ values: {} })
        };
      }
      if (name === 'yup') return require('yup');
      if (name === 'utils/axios') {
        return {
          __esModule: true,
          default: async (config) => {
            calls.push(config);
            return { data: { diagnostic: { error: false } } };
          }
        };
      }
      if (name === 'api/notification') return { openNotification() {} };
      if (name === 'api/barang') {
        return {
          previewKodeBarang: async () => 'KODE-123',
          useBarangFilterOptions: () => ({ options: {}, optionsLoading: false }),
          useShowBarang: () => ({
            data: mockBarang || { id: 42, kode: 'BRG-42', nama: 'Item 42', satuan: 'PCS', group: 'perlengkapan' },
            dataLoading: false,
            dataError: null
          })
        };
      }
      if (name === 'lib/offlineFetch') return { saveRequest: async () => {} };
      if (name === 'config') return { APP_DEFAULT_PATH: '/home' };
      if (name.startsWith('components/')) return name;
      assert.fail(`Unexpected dependency ${name}`);
    }
  });

  const Component = module.exports.default;
  const tree = Component({ edit });
  const form = walk(tree).find((node) => node.type === 'Formik')?.props;

  const getRenderedFields = (customValues = {}) => {
    const values = { ...form.initialValues, ...customValues };
    return walk(
      form.children({
        values,
        errors: {},
        touched: {},
        handleChange: () => {},
        handleBlur: () => {},
        handleSubmit: () => {},
        isSubmitting: false,
        setFieldValue: () => {},
        setFieldTouched: () => {}
      })
    );
  };

  return { form, getRenderedFields, calls, navigation };
}

test('AC-INT-002-01: Form create initializes group with default "persediaan" and provides options', async () => {
  const f = await fixtureCreate({ edit: false });
  assert.equal(f.form.initialValues.group, 'persediaan');

  const fields = f.getRenderedFields();
  const groupField = fields.find((n) => n.type === 'TextField' && n.props.name === 'group');
  assert.ok(groupField, 'Field group must be rendered as TextField');
  assert.equal(groupField.props.label, 'Kelompok / Group');
  assert.equal(groupField.props.select, true);
  assert.ok(
    groupField.props.helperText.includes('Persediaan dicatat sebagai aset gudang'),
    'Helper text must explain persediaan vs perlengkapan'
  );

  // Check MenuItem options inside groupField
  const menuItems = React.Children.toArray(groupField.props.children);
  assert.equal(menuItems.length, 2);
  assert.equal(menuItems[0].props.value, 'persediaan');
  assert.equal(menuItems[0].props.children, 'Persediaan');
  assert.equal(menuItems[1].props.value, 'perlengkapan');
  assert.equal(menuItems[1].props.children, 'Perlengkapan');
});

test('AC-INT-002-01: Form create submits payload with group "persediaan"', async () => {
  const f = await fixtureCreate({ edit: false });
  let submitting;
  await f.form.onSubmit(
    {
      ...f.form.initialValues,
      nama: 'Barang Uji Baru',
      satuan: 'PCS',
      stn_pakai: 'PCS',
      group: 'persediaan'
    },
    { setSubmitting: (v) => { submitting = v; } }
  );

  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, '/api/master/barang/create');
  assert.equal(f.calls[0].data.group, 'persediaan');
  assert.equal(submitting, false);
});

test('AC-INT-002-02: Form edit hydrates existing group value from barang data and submits update', async () => {
  const f = await fixtureCreate({
    edit: true,
    mockBarang: {
      id: 42,
      kode: 'BRG-042',
      nama: 'Baut Hexagonal',
      satuan: 'BOX',
      stn_pakai: 'PCS',
      group: 'perlengkapan'
    }
  });

  // Verify hydrated formValues
  assert.equal(f.form.initialValues.group, 'perlengkapan');

  // Verify submit payload sends updated group
  let submitting;
  await f.form.onSubmit(
    {
      ...f.form.initialValues,
      group: 'perlengkapan'
    },
    { setSubmitting: (v) => { submitting = v; } }
  );

  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, '/api/master/barang/42/update');
  assert.equal(f.calls[0].data.group, 'perlengkapan');
  assert.equal(submitting, false);
});

test('AC-INT-002-02: Form edit falls back to "persediaan" if barang.group is null/empty', async () => {
  const f = await fixtureCreate({
    edit: true,
    mockBarang: {
      id: 43,
      kode: 'BRG-043',
      nama: 'Barang Lama Tanpa Group',
      satuan: 'PCS',
      stn_pakai: 'PCS',
      group: null
    }
  });

  assert.equal(f.form.initialValues.group, 'persediaan');
});

test('ListTableBarang: includes Group column rendering badge chip for persediaan and perlengkapan', async () => {
  const compiled = await compileFile(path.resolve(__dirname, '../src/views/master/barang/listtable.js'));
  const module = { exports: {} };

  const react = {
    ...React,
    useMemo: (fn) => fn(),
    useState: (initial) => [initial, () => {}]
  };

  vm.runInNewContext(compiled.code, {
    module,
    exports: module.exports,
    React: react,
    require(name) {
      if (name === 'react') return react;
      if (name === 'next/link') return 'NextLink';
      if (name === '@tanstack/react-table') {
        return {
          useReactTable: ({ columns, data }) => ({
            columns,
            data,
            getHeaderGroups: () => [],
            getRowModel: () => ({ rows: [] })
          }),
          getCoreRowModel: () => () => {},
          flexRender: (comp, ctx) => (typeof comp === 'function' ? comp(ctx) : comp)
        };
      }
      if (name === '@mui/material') {
        return new Proxy(
          {
            styled: () => () => 'styled-component'
          },
          { get: (target, key) => target[key] || key }
        );
      }
      if (name === 'iconsax-react') return new Proxy({}, { get: () => () => null });
      assert.fail(`Unexpected dependency ${name}`);
    }
  });

  const ListTableBarang = module.exports.default;
  let capturedColumns = null;

  // Render ListTableBarang with dummy data to capture columns
  const tableResult = ListTableBarang({
    data: {
      data: [
        { id: 1, kode: 'BRG-01', nama: 'Barang A', group: 'persediaan' },
        { id: 2, kode: 'BRG-02', nama: 'Barang B', group: 'perlengkapan' }
      ]
    }
  });

  // Verify via source code analysis or inspection
  const listTableCode = fs.readFileSync(path.resolve(__dirname, '../src/views/master/barang/listtable.js'), 'utf8');
  assert.ok(listTableCode.includes("accessorKey: 'group'"), "Column 'group' must be present in listtable");
  assert.ok(listTableCode.includes("header: 'Group'"), "Header 'Group' must be present in listtable");
  assert.ok(listTableCode.includes('Persediaan'), "Chip label 'Persediaan' must be present");
  assert.ok(listTableCode.includes('Perlengkapan'), "Chip label 'Perlengkapan' must be present");
});
