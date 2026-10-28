const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const utilsFile = 'src/views/maintenance/breakdown/utils.js';
const indexFile = 'src/views/maintenance/breakdown/index.js';

let compiledCache = null;
async function getCompiled() {
  if (compiledCache) return compiledCache;
  const files = [utilsFile, indexFile];
  const entries = await Promise.all(
    files.map(async (file) => {
      const code = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
      const res = await transform(code, {
        filename: file,
        jsc: {
          parser: { syntax: 'ecmascript', jsx: true },
          transform: { react: { runtime: 'classic' } },
          target: 'es2022'
        },
        module: { type: 'commonjs' }
      });
      return [file, res.code];
    })
  );
  compiledCache = Object.fromEntries(entries);
  return compiledCache;
}

async function load(file, dependencies = {}) {
  const compiled = await getCompiled();
  const module = { exports: {} };
  vm.runInNewContext(compiled[file], {
    module,
    exports: module.exports,
    React,
    console,
    URLSearchParams,
    require(name) {
      if (name in dependencies) return dependencies[name];
      if (name === 'moment') return require('moment');
      if (name === 'moment/locale/id') return {};
      throw new Error(`Unexpected dependency in test: ${name}`);
    }
  });
  return module.exports;
}

function hookRuntime() {
  let cursor = 0;
  const slots = [];
  const effects = [];
  return {
    react: {
      ...React,
      useMemo(factory) {
        cursor++;
        return factory();
      },
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) {
          slots[index] = {
            value: typeof initial === 'function' ? initial() : initial
          };
        }
        return [
          slots[index].value,
          (value) => {
            slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
          }
        ];
      },
      useEffect(callback, deps) {
        const index = cursor++;
        const previous = slots[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          effects.push(() => {
            previous?.cleanup?.();
            slots[index] = { deps, cleanup: callback() };
          });
        }
      }
    },
    render(callback) {
      cursor = 0;
      const result = callback();
      effects.splice(0).forEach((effect) => effect());
      return result;
    }
  };
}

const componentRegistry = new Map();
function getMockComponent(name) {
  if (!componentRegistry.has(name)) {
    const comp = function (props) {
      return React.createElement('div', { 'data-component': name, ...props }, props.children);
    };
    comp.displayName = name;
    componentRegistry.set(name, comp);
  }
  return componentRegistry.get(name);
}

function walk(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  if (!React.isValidElement(node)) return [];
  const children = React.Children.toArray(node.props?.children).flatMap(walk);
  return [node, ...children];
}

test('AC-BD-11 formatBreakdownIssues: handles empty, null, undefined', async () => {
  const utils = await load(utilsFile);
  assert.equal(utils.formatBreakdownIssues(null), '-');
  assert.equal(utils.formatBreakdownIssues(undefined), '-');
  assert.equal(utils.formatBreakdownIssues([]), '-');
  assert.equal(utils.formatBreakdownIssues([{ problem_issue: '   ' }]), '-');
});

test('AC-BD-11 formatBreakdownIssues: single issue and fallback to deskripsi', async () => {
  const utils = await load(utilsFile);
  assert.equal(utils.formatBreakdownIssues([{ problem_issue: 'Oli bocor' }]), 'Oli bocor');
  assert.equal(utils.formatBreakdownIssues([{ deskripsi: 'Mesin tidak menyala' }]), 'Mesin tidak menyala');
  assert.equal(utils.formatBreakdownIssues([{ problem_issue: 'Kabel putus', deskripsi: 'cadangan' }]), 'Kabel putus');
});

test('AC-BD-11 formatBreakdownIssues: multiple issues separated by comma space', async () => {
  const utils = await load(utilsFile);
  const items = [
    { problem_issue: 'Bocor selang hidrolik' },
    { problem_issue: 'Lampu kerja padam' },
    { problem_issue: 'Track kendur' }
  ];
  assert.equal(utils.formatBreakdownIssues(items), 'Bocor selang hidrolik, Lampu kerja padam, Track kendur');
});

test('AC-BD-11 formatBreakdownIssues: filters out inactive (aktif === N) items', async () => {
  const utils = await load(utilsFile);
  const items = [
    { problem_issue: 'Issue aktif 1', aktif: 'Y' },
    { problem_issue: 'Issue nonaktif', aktif: 'N' },
    { problem_issue: 'Issue aktif 2', aktif: 'Y' }
  ];
  assert.equal(utils.formatBreakdownIssues(items), 'Issue aktif 1, Issue aktif 2');
});

test('AC-BD-10, 11, 12, 13, 14 Table structure & Mobile Card verification', async () => {
  const utils = await load(utilsFile);
  const h = hookRuntime();

  const mockRows = [
    {
      id: 101,
      equipment_id: 1,
      equipment: { kode: 'EX-01', model: 'PC200-8' },
      cabang: { nama: 'Site Batukajang', area: 'Kalsel' },
      date_issue: '2026-10-28',
      breakdown_at: '2026-10-28 08:00:00',
      ready_at: '2026-10-28 12:30:00',
      lokasi_id: 10,
      lokasi: { nama: 'Pit North 2' },
      status: 0,
      items: [
        { problem_issue: 'Kebocoran radiator hose utama dan oli rembes di sambungan pipa turbocharger yang sangat panjang deskripsinya', aktif: 'Y' },
        { problem_issue: 'Sensor temperatur mesin error', aktif: 'Y' }
      ]
    },
    {
      id: 102,
      equipment_id: 2,
      equipment: { kode: 'DT-05', model: 'FM260TI' },
      cabang: { nama: 'Site Sangatta', area: 'Kaltim' },
      date_issue: '2026-10-28',
      breakdown_at: '2026-10-28 07:00:00',
      ready_at: null,
      lokasi_id: null,
      lokasi: null,
      status: 1,
      items: []
    }
  ];

  let currentMobile = false;

  const muiProxy = new Proxy(
    {
      useTheme: () => ({
        breakpoints: { down: () => 'down_md' },
        palette: { divider: '#ccc', grey: { 100: '#f5f5f5' } }
      }),
      useMediaQuery: () => currentMobile
    },
    {
      get: (target, name) => {
        if (name in target) return target[name];
        return getMockComponent(name);
      }
    }
  );

  const iconProxy = new Proxy(
    {},
    {
      get: (_, name) => getMockComponent(`Icon_${name}`)
    }
  );

  const mockApi = {
    useBreakdownList: () => ({ data: mockRows, total: mockRows.length, dataLoading: false, dataError: null, mutate: () => {} }),
    useBreakdownStatistics: () => ({ data: { total: 2 }, dataLoading: false }),
    downloadBreakdownPdf: async () => ({ blob: {}, filename: 'test.pdf' }),
    getBreakdownMasters: async () => ({ cabangs: [], equipments: [], lokasis: [], penyewas: [], shifts: [], pengawases: [], _failed: [] })
  };

  const indexModule = await load(indexFile, {
    react: h.react,
    'next/link': function NextLink(props) {
      return React.createElement('a', { href: props.href, ...props }, props.children);
    },
    '@mui/material': muiProxy,
    'iconsax-react': iconProxy,
    'components/@extended/Breadcrumbs': () => React.createElement('div', null, 'Breadcrumbs'),
    'components/MainCard': (props) => React.createElement('div', null, props.title, props.secondary, props.children),
    'config': { APP_DEFAULT_PATH: '/' },
    'api/notification': { openNotification: () => {} },
    'api/daily-breakdown-form': mockApi,
    'api/summary-breakdown': { downloadSummaryBreakdownPdf: async () => ({ blob: {}, filename: 'summary.pdf' }) },
    './utils': utils
  });

  const BreakdownList = indexModule.default;

  // 1. Desktop Test (currentMobile = false)
  currentMobile = false;
  let nodes = h.render(() => walk(BreakdownList()));

  // TableHead checks:
  const tableHeads = nodes.filter((n) => n.type === getMockComponent('TableHead'));
  assert.equal(tableHeads.length, 1, 'TableHead should exist');

  const headCells = nodes.filter((n) => n.type === getMockComponent('TableCell') && typeof n.props.children === 'string');
  const headLabels = headCells.map((n) => n.props.children);

  assert.ok(headLabels.includes('Issue Breakdown'), 'Header must contain "Issue Breakdown"');
  assert.ok(headLabels.includes('Lokasi'), 'Header must contain "Lokasi"');
  assert.ok(!headLabels.includes('Issues'), 'Old header "Issues" must be removed');
  assert.ok(!headLabels.includes('Durasi'), 'Old standalone "Durasi" header must be removed');

  // Verify TableRow row 1 (with items and location)
  const tooltips = nodes.filter((n) => n.type === getMockComponent('Tooltip') && n.props.title && n.props.title.includes('Kebocoran radiator hose'));
  assert.equal(tooltips.length, 1, 'Tooltip should be present with full issue text');
  assert.equal(tooltips[0].props.title, 'Kebocoran radiator hose utama dan oli rembes di sambungan pipa turbocharger yang sangat panjang deskripsinya, Sensor temperatur mesin error');

  // Verify line clamp on the issue narrative typography
  const issueTypography = tooltips[0].props.children;
  assert.equal(issueTypography.props.variant, 'body2');
  assert.equal(issueTypography.props.sx.WebkitLineClamp, 2);
  assert.equal(issueTypography.props.sx.overflow, 'hidden');
  assert.equal(issueTypography.props.sx.textOverflow, 'ellipsis');

  // Verify row 2 (no items -> displays '-')
  const emptyIssueTypo = nodes.find(
    (n) => n.type === getMockComponent('Typography') && n.props.children === '-' && n.props.color === 'text.secondary'
  );
  assert.ok(emptyIssueTypo, 'Dash "-" should be rendered for rows without issues without tooltip bubble');

  // Verify Lokasi cell in desktop row 1 (Lokasi on line 1, Duration on line 2)
  const pitNorth = nodes.find((n) => n.type === getMockComponent('Typography') && n.props.children === 'Pit North 2');
  assert.ok(pitNorth, 'Location Pit North 2 should be rendered');
  assert.equal(pitNorth.props.fontWeight, 500);

  // 2. Mobile View Test (currentMobile = true)
  currentMobile = true;
  nodes = h.render(() => walk(BreakdownList()));

  const cards = nodes.filter((n) => n.type === getMockComponent('Card'));
  assert.equal(cards.length, 2, '2 mobile cards should be rendered');

  const mobileIssueLabel = nodes.find((n) => n.type === getMockComponent('Typography') && n.props.children === 'Issue Breakdown:');
  assert.ok(mobileIssueLabel, 'Mobile card should have "Issue Breakdown:" label');

  const mobileTooltips = nodes.filter((n) => n.type === getMockComponent('Tooltip') && n.props.title && n.props.title.includes('Kebocoran radiator hose'));
  assert.equal(mobileTooltips.length, 1, 'Mobile card should support tooltip for long issue text');
});
