const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transform } = require('next/dist/build/swc');

const files = [
  'src/api/home-dashboard-config.js', 'src/api/home-dashboard.js',
  'src/views/home/index.js', 'src/views/home/utils.js',
  ...['HeroHeader', 'KpiCard', 'SectionCard', 'DashboardGrid', 'PrAgingCard', 'SparepartSection', 'MaintenanceSection'].map(name => `src/views/home/components/${name}.js`)
];
const compiled = Promise.all(files.map(async file => [file, (await transform(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
  filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' }, module: { type: 'commonjs' }
})).code])).then(Object.fromEntries);

async function fixture(options = {}) {
  const code = await compiled;
  const cache = {};
  const requests = [];
  const refreshed = [];
  const charts = [];
  let dashboard;
  const theme = {
    palette: {
      primary: { main: '#4680ff' }, info: { main: '#00aaff' }, success: { main: '#009900' }, warning: { main: '#ff9900' }, error: { main: '#cc0000' }, secondary: { main: '#6600ff' },
      background: { paper: '#fff' }, text: { secondary: '#666' }, divider: '#ddd', common: { black: '#000' }, mode: 'light'
    }, typography: { fontFamily: 'sans-serif' }
  };
  const chart = props => { charts.push(props); return React.createElement('div', { 'data-chart': props.type }); };
  const mui = name => ({ children, label, href, role, value, id }) => React.createElement(href ? 'a' : name === 'Typography' ? 'p' : 'div', {
    href, role, id, ...(name === 'LinearProgress' ? { 'data-value': value } : {})
  }, name === 'Skeleton' ? 'Loading' : children || label);

  const payload = url => {
    const endpoint = new URL(url, 'http://test.local').pathname;
    if (endpoint.endsWith('/ritase/signage/summary')) return { rows: { ritase_daily_total: 120, ritase_monthly_cumulative: 650, cycle_time: { avg: 25, min: 10, max: 35 } } };
    if (endpoint.endsWith('/chart-polar')) return [{ ctgequipment: 'HE', total: 4, status_count: { WS: 1, WT: 3 } }, { ctgequipment: 'MD', total: 2, status_count: { WV: 2 } }];
    if (endpoint.endsWith('/breakdown-trend-monthly')) return { rows: { categories: ['Sep 2026', 'Oct 2026'], series: [{ name: 'Total Breakdown', data: [5, 6] }, { name: 'Done', data: [2, 3] }, { name: 'Wait Service', data: [3, 3] }] } };
    if (endpoint.endsWith('/usia-berkas')) return { data: [{ label: '< 3 hari', count: 2 }, { label: '1 minggu', count: 3 }, { label: '2 minggu', count: 1 }, { label: '3 minggu', count: 4 }] };
    if (endpoint.endsWith('/order-payments/summary')) return { rows: { pending: 3, pending_amount: 4500000 } };
    const category = endpoint.match(/top-value-(he|dt|md|ad)$/)?.[1]?.toUpperCase();
    if (category) return { data: [{ idbarang: 9, nmbarang: `${category} Part`, total_value: { HE: '1000000', DT: '2000000', MD: '9000000', AD: '3000000' }[category], total_qtyused: '2.5' }] };
    assert.fail(`Unexpected dashboard request ${url}`);
  };

  const useSWR = key => {
    const url = Array.isArray(key) ? key[0] : key;
    requests.push(url);
    return {
      data: options.empty ? null : payload(url), isLoading: !!options.loading,
      error: options.paymentError && url.includes('/order-payments/') ? new Error('Forbidden') : null,
      mutate: async () => { refreshed.push(url); if (options.refreshError && url.includes('/order-payments/')) throw new Error('timeout'); }
    };
  };

  function load(file) {
    if (cache[file]) return cache[file].exports;
    const module = { exports: {} };
    cache[file] = module;
    vm.runInNewContext(code[file], {
      module, exports: module.exports, URLSearchParams, console, React,
      require(name) {
        if (name === 'react') return React;
        if (name === 'moment') return require('moment');
        if (name === 'swr') return { __esModule: true, default: useSWR };
        if (name === 'utils/axios') return { fetcher() {} };
        if (name === '@mui/material/styles') return { useTheme: () => theme, alpha: color => color };
        if (name.startsWith('@mui/material/')) return mui(name.split('/').pop());
        if (name === 'iconsax-react') return new Proxy({}, { get: () => () => null });
        if (name === 'next/link') return ({ children, href }) => React.createElement('a', { href }, children);
        if (name === 'next/dynamic') return () => chart;
        if (name === 'api/cabang') return { useCabang: () => ({ data: [] }) };
        if (name === 'api/home-dashboard') return { useHomeDashboard: filters => { dashboard = load('src/api/home-dashboard.js').useHomeDashboard(filters); return dashboard; } };
        if (name.startsWith('.')) return load(path.posix.normalize(`${path.posix.dirname(file)}/${name}.js`));
        assert.fail(`Unexpected dependency ${name}`);
      }
    }, { filename: file });
    return module.exports;
  }

  return {
    config: load('src/api/home-dashboard-config.js'), utils: load('src/views/home/utils.js'), requests, refreshed, charts,
    render() { return renderToStaticMarkup(React.createElement(load('src/views/home/index.js').default)); },
    getDashboard: () => dashboard
  };
}

test('home renders exactly the eight requested KPI labels and excludes removed sections', async () => {
  const f = await fixture();
  const html = f.render();
  for (const label of ['Ritase', 'Cycle Time', 'Breakdown', 'Pending Pembayaran', 'PR Aging', 'High Cost Parts', 'Top Kategori Equipment', 'Trend Breakdown Bulanan']) {
    assert.ok(html.includes(`>${label}</p>`), label);
  }
  for (const removed of ['Attendance Rate', 'Pending Approvals', 'PR Approval Rate', 'Action Center', 'People Analytics', 'Pengajuan Dana Total', 'Sparepart Usage Trend', 'By Category', 'Spending per Cabang', 'Top Supplier', 'Data Quality', 'Breakdown Status']) {
    assert.ok(!html.includes(removed), removed);
  }
  assert.ok(html.includes('120'));
  assert.ok(html.includes('25 m'));
  assert.ok(html.includes('Status 0'));
  assert.ok(html.indexOf('MD Part') < html.indexOf('HE Part'));
});

test('home fetches only nine resources; refresh never refreshes unrelated dashboards', async () => {
  const f = await fixture();
  f.render();
  assert.equal(f.requests.length, 9);
  assert.equal(new Set(f.requests).size, 9);
  assert.ok(f.requests.every(url => !/attendance|crew-work|pengajuan-dana|spending-per-cabang|approval-rate|active-duration-stack|summary-breakdown|gudang-top-value/.test(url)));
  assert.equal(await f.getDashboard().refresh(), true);
  assert.deepEqual(f.refreshed, f.requests);
});

test('request filters preserve status zero, include older payment/PR documents, and scope branch/date', async () => {
  const { config } = await fixture();
  const requests = config.buildHomeDashboardRequests({ date_ops: '2026-06-17', cabang_id: 7, unitcabang: 'Site A & B' });
  const query = key => new URL(requests[key], 'http://test.local').searchParams;
  assert.equal(query('payments').get('sts_code'), '0');
  assert.equal(query('payments').has('date_start'), false);
  assert.equal(query('payments').get('date_end'), '2026-06-17');
  assert.equal(query('payments').get('cabang_id'), '7');
  assert.equal(query('prAging').has('startdate'), false);
  assert.equal(query('prAging').get('enddate'), '2026-06-17');
  assert.equal(query('prAging').get('as_of_date'), '2026-06-17');
  assert.equal(query('polar').get('cabang_id'), '7');
  assert.equal(query('trendMonthly').get('startdate'), '2026-01-01');
  for (const category of ['He', 'Dt', 'Md', 'Ad']) {
    assert.equal(query(`partTop${category}`).get('unitcabang'), 'Site A & B');
    assert.equal(query(`partTop${category}`).get('limit'), '8');
  }
});

test('breakdown WS remains active and monthly response rows are unwrapped', async () => {
  const f = await fixture();
  const polar = f.utils.normalizePolarBreakdown([{ ctgequipment: 'AD', total: 4, status_count: { WS: 2, WT: 1, DONE: 1 } }]);
  assert.equal(polar.open, 3);
  assert.equal(polar.closed, 1);
  f.render();
  const trend = f.charts.find(chart => chart.type === 'area');
  assert.deepEqual(Array.from(trend.options.xaxis.categories), ['Sep 2026', 'Oct 2026']);
  assert.deepEqual(Array.from(trend.series, row => row.name), ['Total Breakdown', 'Done']);
  const category = f.charts.find(chart => chart.type === 'bar');
  assert.deepEqual(Array.from(category.series[0].data), [4, 2]);
});

test('high cost parts use numeric total_value and total_qtyused from all four categories', async () => {
  const f = await fixture();
  f.render();
  const rows = f.utils.normalizeHighCostParts(f.getDashboard().sparepart);
  assert.deepEqual(Array.from(rows, row => row.category), ['MD', 'AD', 'DT', 'HE']);
  assert.equal(rows[0].value, 9000000);
  assert.equal(rows[0].qty, 2.5);
});

test('error and loading states do not present unavailable payment data as a valid zero', async () => {
  const denied = await fixture({ paymentError: true });
  assert.ok(denied.render().includes('Data tidak tersedia'));
  const loading = await fixture({ loading: true });
  assert.ok(loading.render().includes('Loading'));
  const empty = await fixture({ empty: true });
  const html = empty.render();
  assert.ok(html.includes('Belum ada dokumen PR pada periode ini'));
  assert.ok(html.includes('Belum ada data sparepart bernilai tinggi'));
});

test('a failed refresh is handled without an unhandled promise rejection', async () => {
  const f = await fixture({ refreshError: true });
  f.render();
  assert.equal(await f.getDashboard().refresh(), false);
  assert.equal(f.refreshed.length, 9);
});
