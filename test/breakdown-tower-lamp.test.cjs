const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const apiFile = 'src/api/daily-breakdown-form.js';
const formFile = 'src/views/maintenance/breakdown/form.js';
const utilsFile = 'src/views/maintenance/breakdown/utils.js';
const compiled = Promise.all([apiFile, formFile, utilsFile].map(async (file) => [file, (await transform(
  fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
  { filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' }, module: { type: 'commonjs' } }
)).code])).then(Object.fromEntries);
const flush = () => new Promise((resolve) => setImmediate(resolve));
const towerLamp = { id: 900, kode: 'TL-001', nama: 'Tower Lamp 6 kW', kategori: 'TL' };
const production = [{ id: 1, kode: 'EX-001', kategori: 'HE' }, { id: 2, kode: 'LT-001', kategori: 'LT' }];

async function load(file, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext((await compiled)[file], {
    module, exports: module.exports, React, console, URLSearchParams,
    require(name) { if (name in dependencies) return dependencies[name]; throw new Error(`Unexpected dependency: ${name}`); }
  });
  return module.exports;
}

function transport({ paginated = false, failure, duplicate = false } = {}) {
  const requests = [];
  const posts = [];
  return {
    requests, posts,
    async get(url, config) {
      requests.push({ url, config });
      if (failure === url) throw new Error('Network error');
      if (url === '/master/equipment/produksi') return { data: { rows: duplicate ? [...production, { ...towerLamp, id: '900' }] : production } };
      if (url === '/master/equipment/list') {
        assert.equal(config.params.kategori, 'TL');
        const lamps = [towerLamp];
        return { data: { rows: paginated ? { data: lamps, page: 1, lastPage: 1 } : lamps } };
      }
      const data = {
        '/master/cabang/list': [{ id: 3, nama: 'Site' }],
        '/master/lokasi-kerja/list': [{ id: 4, nama: 'Pit' }],
        '/master/penyewa/list': [{ id: 5, nama: 'Penyewa' }],
        '/master/shift/list': [{ id: 6, nama: 'Malam' }],
        '/master/karyawan/pengawas': [{ id: 7, nama: 'Pengawas' }]
      };
      assert.ok(data[url], `Unexpected master URL ${url}`);
      return { data: { rows: data[url] } };
    },
    async post(url, body) {
      posts.push({ url, body });
      return { data: { rows: { id: 55, ...body } } };
    }
  };
}

async function api(client, hooks = { useMemo: (factory) => factory() }, detail) {
  return load(apiFile, {
    react: hooks,
    swr: () => ({ data: detail ? { rows: detail } : undefined, isLoading: false }),
    'utils/axios': client
  });
}

for (const paginated of [false, true]) {
  test(`breakdown masters include TL alongside existing HE/LT for ${paginated ? 'paginated' : 'flat'} equipment responses`, async () => {
    const client = transport({ paginated });
    const { getBreakdownMasters } = await api(client);
    const result = await getBreakdownMasters();
    assert.deepEqual(Array.from(result.equipments, (row) => row.kategori), ['HE', 'LT', 'TL']);
    assert.equal(result.equipments.find((row) => row.id === 900).nama, towerLamp.nama);
    assert.equal(result._failed.length, 0);
    assert.equal(result.pengawases[0].id, 7);
    assert.equal(client.requests.length, 7);
    assert.equal(Object.hasOwn(result, 'towerLamps'), false);
  });
}

test('merged equipment uses unique IDs even when production already includes a Tower Lamp', async () => {
  const { getBreakdownMasters } = await api(transport({ duplicate: true }));
  const result = await getBreakdownMasters();
  assert.equal(result.equipments.length, 3);
  assert.equal(result.equipments.filter((row) => String(row.id) === '900').length, 1);
});

test('a TL request failure preserves production options and reports the missing category', async () => {
  const { getBreakdownMasters } = await api(transport({ failure: '/master/equipment/list' }));
  const result = await getBreakdownMasters();
  assert.deepEqual(Array.from(result.equipments, (row) => row.kategori), ['HE', 'LT']);
  assert.ok(result._failed.includes('equipment TL'));
  assert.equal(result.lokasis.length, 1);
});

test('TL remains available if the production request fails', async () => {
  const { getBreakdownMasters } = await api(transport({ failure: '/master/equipment/produksi' }));
  const result = await getBreakdownMasters();
  assert.equal(result.equipments.length, 1);
  assert.equal(result.equipments[0].kategori, 'TL');
  assert.ok(result._failed.includes('equipments'));
});

function hookRuntime() {
  let cursor = 0;
  const slots = [];
  const effects = [];
  return {
    react: {
      ...React,
      useMemo(factory) { cursor++; return factory(); },
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) slots[index] = { value: initial };
        return [slots[index].value, (value) => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
      },
      useEffect(callback, deps) {
        const index = cursor++;
        const previous = slots[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
        }
      }
    },
    render(callback) { cursor = 0; const result = callback(); effects.splice(0).forEach((effect) => effect()); return result; }
  };
}

function walk(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(walk)];
}

async function formFixture(detail) {
  const h = hookRuntime();
  const client = transport();
  const masters = await api(client, h.react, detail);
  const utils = await load(utilsFile, { moment: require('moment'), 'moment/locale/id': {} });
  const { default: Form } = await load(formFile, {
    react: h.react,
    'next/navigation': { useRouter: () => ({ push() {}, refresh() {} }) }, 'next/link': 'NextLink',
    moment: require('moment'), 'moment/locale/id': {},
    '@mui/material': new Proxy({}, { get: (_, name) => name }), 'iconsax-react': { Add: 'Add', Trash: 'Trash' },
    'components/@extended/Breadcrumbs': 'Breadcrumbs', 'components/@extended/LoadingButton': 'LoadingButton', 'components/MainCard': 'MainCard',
    'api/notification': { openNotification() {} }, 'api/daily-breakdown-form': masters, './utils': utils
  });
  const render = () => h.render(() => walk(Form({ headerId: detail?.id })));
  render();
  await flush();
  return { client, render };
}

const autocomplete = (nodes, label) => nodes.find((node) => node.type === 'Autocomplete' && node.props.renderInput({}).props.label === label);

test('Tower Lamp is selectable in the actual create form and submitted as equipment_id', async () => {
  const f = await formFixture();
  let nodes = f.render();
  const equipment = autocomplete(nodes, 'Equipment');
  const lamp = equipment.props.options.find((row) => row.kategori === 'TL');
  assert.ok(lamp);
  assert.match(equipment.props.getOptionLabel(lamp), /TL-001.*Tower Lamp/);
  equipment.props.onChange(null, lamp);
  for (const label of ['Lokasi Kerja', 'Pengawas', 'Penyewa']) {
    const input = autocomplete(nodes, label);
    input.props.onChange(null, input.props.options[0]);
  }
  nodes.find((node) => node.type === 'TextField' && node.props.label === 'Waktu Breakdown').props.onChange({ target: { value: '2026-10-22T19:00' } });
  nodes.find((node) => node.type === 'Select' && node.props.label === 'Kategori *').props.onChange({ target: { value: 'ELECTRICAL' } });
  nodes.find((node) => node.type === 'TextField' && node.props.label === 'Deskripsi Problem').props.onChange({ target: { value: 'Lampu tidak menyala' } });
  nodes = f.render();
  assert.equal(autocomplete(nodes, 'Equipment').props.value.id, 900);
  await nodes.find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(f.client.posts.length, 1);
  assert.equal(f.client.posts[0].url, '/operation/daily-breakdown/create');
  assert.equal(f.client.posts[0].body.equipment_id, 900);
  assert.equal(f.client.posts[0].body.items[0].problem_issue, 'Lampu tidak menyala');
});

test('the edit form resolves a stored TL equipment ID against the loaded options', async () => {
  const f = await formFixture({ id: 55, equipment_id: '900', breakdown_at: '2026-10-22 19:00:00', items: [] });
  const equipment = autocomplete(f.render(), 'Equipment');
  assert.equal(equipment.props.value.id, 900);
  assert.equal(equipment.props.value.kategori, 'TL');
  assert.equal(equipment.props.isOptionEqualToValue(equipment.props.value, { id: '900' }), true);
});
