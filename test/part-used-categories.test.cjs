const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transform } = require('next/dist/build/swc');

const params = { start_date: '2026-10-01', end_date: '2026-10-16', limit: 20, mode: 'raw' };
const files = {
  config: 'src/api/part-used-chart-config.js',
  api: 'src/api/part-used-charts.js',
  screen: 'src/views/signages/sparepart-used/index.js',
  cabang: 'src/views/signages/sparepart-used/CabangBarChart.js'
};
const compiled = Promise.all(Object.entries(files).map(async ([key, file]) => {
  const result = await transform(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    filename: file,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' },
    module: { type: 'commonjs' }
  });
  return [key, result.code];
})).then(Object.fromEntries);

function load(code, resolve) {
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: resolve, URLSearchParams, setTimeout, clearTimeout });
  return module.exports;
}

async function fixture({ slideshow = false, index = 0, branch = '', empty = false } = {}) {
  const code = await compiled;
  const config = load(code.config, () => assert.fail('Configuration must have no dependencies'));
  const requests = [];
  const react = {
    ...React,
    useState(initial) {
      return React.useState(initial === false ? slideshow : initial === 0 ? index : initial === '' ? branch : initial);
    }
  };
  const useSWR = (url) => {
    requests.push(url);
    const parsed = new URL(url, 'http://test.local');
    const category = parsed.searchParams.get('ctgunit') || parsed.pathname.match(/(?:frequency-|value-|cabang-)(he|dt|md|ad)/)?.[1]?.toUpperCase();
    return { data: { data: empty ? [] : [{ category, kdunit: `${category || 'ALL'}-01`, nmbarang: `${category || 'ALL'} Part`, total_value: 1000000, frequency: 2, unitcabang: 'Site A' }], meta: { average: { total_value: 500000, frequency: 1 } } }, isLoading: false };
  };
  const api = load(code.api, (name) => {
    if (name === 'react') return react;
    if (name === 'swr') return { __esModule: true, default: useSWR };
    if (name === 'utils/axios') return { fetcher() {} };
    if (name === './part-used-chart-config') return config;
    assert.fail(`Unexpected API dependency: ${name}`);
  });
  const Chart = ({ data }) => React.createElement('div', { 'data-chart': 'CabangBarChart' }, JSON.stringify(data));
  const cabang = load(code.cabang, (name) => {
    if (name === 'react') return react;
    if (name === 'react-chartjs-2') return { Bar: Chart };
    if (name === 'chart.js') return { Chart: { register() {} } };
    assert.fail(`Unexpected chart dependency: ${name}`);
  });
  const screen = load(code.screen, (name) => {
    if (name === 'react') return react;
    if (name === 'swr') return { mutate() {} };
    if (name === 'moment') return require('moment');
    if (name === 'api/part-used-charts') return api;
    if (name === 'api/part-used-chart-config') return config;
    if (name === '@mui/material/styles') return { useTheme: () => ({ palette: { text: { secondary: '#333' } } }) };
    if (name.startsWith('@mui/material/')) return ({ children }) => React.createElement('div', null, children);
    if (name === 'iconsax-react') return { PresentionChart: () => null };
    if (name === './CabangBarChart') return cabang;
    if (name.startsWith('./')) return ({ data }) => React.createElement('div', {
      'data-chart': name.slice(2), 'data-category': data?.[0]?.category || ''
    });
    assert.fail(`Unexpected screen dependency: ${name}`);
  });
  return { config, requests, cabang: cabang.default, render: () => renderToStaticMarkup(React.createElement(screen.default)) };
}

for (const category of ['HE', 'DT', 'MD', 'AD']) {
  test(`${category}: endpoints and branch filters stay isolated across all six analyses`, async () => {
    const { config } = await fixture();
    const before = { ...params };
    const requests = config.buildCategoryRequests(category, params, 'Site A & B');
    const slug = category.toLowerCase();
    assert.equal(requests.topFrequency.endpoint, `/maintenance/signages/part-used/top-frequency-${slug}`);
    assert.equal(requests.topValue.endpoint, `/maintenance/signages/part-used/top-value-${slug}`);
    assert.equal(requests.cabang.endpoint, `/maintenance/signages/part-used/cabang-${slug}-bar`);
    for (const field of ['byUnit', 'byCategory', 'equipmentByCabang']) {
      const query = new URL(requests[field].url, 'http://test.local').searchParams;
      assert.equal(query.get('ctgunit'), category);
      assert.equal(query.get('start_date'), params.start_date);
      assert.equal(query.get('end_date'), params.end_date);
      assert.equal(query.get('unitcabang'), field === 'equipmentByCabang' ? 'Site A & B' : null);
    }
    assert.equal(config.buildCategoryRequests(category, params).equipmentByCabang.url, requests.byUnit.url);
    assert.deepEqual(params, before);
  });
}

test('overview renders all four categories for each analysis and applies selected branch only to equipment details', async () => {
  const f = await fixture({ branch: 'Site A' });
  const html = f.render();
  for (const category of ['HE', 'DT', 'MD', 'AD']) {
    for (const title of [`Pemakaian per Unit Kategori ${category}`, `Pemakaian per Kategori Barang ${category}`, `Pemakaian Unit Kategori ${category} per Cabang`, `Kategori ${category} (X: kdunit, Y: Nilai Juta)`]) {
      assert.ok(html.includes(title), title);
    }
    const categoryRequests = f.requests.filter(url => new URL(url, 'http://test.local').searchParams.get('ctgunit') === category);
    assert.equal(categoryRequests.length, 3);
    assert.equal(categoryRequests.filter(url => new URL(url, 'http://test.local').searchParams.get('unitcabang') === 'Site A').length, 1);
    assert.ok(html.includes(`Nilai ${category} (Juta)`));
  }
  for (const chart of ['TopFrequencyChart', 'TopValueChart', 'ByUnitChart', 'ByCategoryChart', 'CabangBarChart', 'EquipmentValueByCabangChart']) {
    assert.equal((html.match(new RegExp(`data-chart="${chart}"`, 'g')) || []).length, 4, chart);
  }
});

test('slideshow renders 28 distinct slides, including five MD and five AD analyses', async () => {
  const titles = [];
  for (let index = 0; index < 28; index++) {
    const f = await fixture({ slideshow: true, index });
    const html = f.render();
    const title = html.match(/<h3[^>]*>(.*?)<\/h3>/)?.[1];
    assert.ok(title, `slide ${index} must exist`);
    titles.push(title);
  }
  assert.equal(new Set(titles).size, 28);
  assert.equal(titles.filter(title => title.includes('MD')).length, 5);
  assert.equal(titles.filter(title => title.includes('AD')).length, 5);
});

test('category slideshow refresh uses the same cache URLs as its data hooks', async () => {
  const { config } = await fixture();
  const keys = [];
  for (const { code } of config.EQUIPMENT_CATEGORIES) {
    const requests = config.buildCategoryRequests(code, params, 'Site A');
    const slides = config.getCategorySlideDefinitions({ code, requests });
    assert.equal(slides.length, 5);
    for (const slide of slides) {
      assert.equal(slide.url, config.buildPartUsedChartUrl(requests[slide.field].endpoint, requests[slide.field].params));
      assert.equal(new URL(slide.url, 'http://test.local').searchParams.has('unitcabang'), false);
      keys.push(slide.key);
    }
  }
  assert.equal(new Set(keys).size, 20);
});

test('new branch chart handles empty categories and preserves numeric values and average', async () => {
  const { cabang } = await fixture();
  assert.equal(renderToStaticMarkup(React.createElement(cabang, { data: [], category: 'MD' })), '<p>No data available</p>');
  const html = renderToStaticMarkup(React.createElement(cabang, { category: 'AD', color: '#abc', data: [{ unitcabang: 'Site A', total_value: '2000000' }], average: { total_value: '1000000' } }));
  assert.ok(html.includes('Nilai AD (Juta)'));
  assert.ok(html.includes('&quot;data&quot;:[2]'));
  assert.ok(html.includes('&quot;data&quot;:[1]'));
});
