const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const base = 'src/views/scm/order-payment/';
const compiled = Promise.all(['list.js', 'detail.js'].map(async name => [name, (await transform(fs.readFileSync(path.resolve(__dirname, '..', base, name), 'utf8'), {
  filename: name,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' },
  module: { type: 'commonjs' }
})).code])).then(Object.fromEntries);
const flush = () => new Promise(resolve => setImmediate(resolve));

function walk(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(walk)];
}

async function fixture(options = {}) {
  const code = await compiled;
  let cursor = 0;
  const slots = [];
  const effects = [];
  const calls = { fetch: [], navigate: [], open: [], autoPrint: 0, notices: [] };
  const react = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] || (slots[index] = { current: initial }); },
    useMemo: factory => factory(),
    useCallback: callback => callback,
    useEffect: callback => effects.push(callback)
  };
  class Pdf {
    constructor() {
      this.internal = { scaleFactor: 72 / 25.4, getNumberOfPages: () => 1 };
      for (const method of ['setFontSize', 'setFont', 'text', 'setDrawColor', 'setLineWidth', 'line', 'addImage', 'addPage', 'setPage']) this[method] = () => {};
    }
    splitTextToSize(value) { return [value]; }
    autoPrint() { calls.autoPrint++; }
    output(mode) { assert.equal(mode, 'bloburl'); return 'blob:payment-pdf'; }
  }
  const row = { id: '16851', kdbayar: 'BB-16851', status: options.paid === false ? 'pending' : 'paid', items: [], payment_attachments: [], bisnis_nama: 'MKG' };
  const window = { location: { search: options.query || '', replace: url => calls.navigate.push(url) }, open: (...args) => calls.open.push(args) };
  function load(name) {
    const module = { exports: {} };
    vm.runInNewContext(code[name], {
      module, exports: module.exports, React, window, URLSearchParams,
      require(dependency) {
        if (dependency === 'react') return react;
        if (dependency === '@mui/material') return new Proxy({}, { get: (_, key) => key });
        if (dependency === 'next/link') return 'NextLink';
        if (dependency === 'next/navigation') return { useParams: () => ({ id: row.id }), useRouter: () => ({ push() {} }) };
        if (dependency.startsWith('@mui/icons-material/')) return () => null;
        if (dependency === 'iconsax-react') return new Proxy({}, { get: () => () => null });
        if (dependency.startsWith('moment')) return require(dependency);
        if (dependency === 'api/order-payments') return {
          useOrderPaymentAccess: () => ({ permissions: {} }),
          useOrderPaymentDetail: () => ({ row, loading: !!options.loading, error: options.error, refresh: async () => {} }),
          fetchWallets: async () => [],
          fetchPrintDefinition: async id => { calls.fetch.push(id); if (options.printError) throw new Error('Print data unavailable'); return { bisnis: { name: 'MKG', alamat: 'Jl. Contoh', kota: 'Makassar' }, signatures: {} }; }
        };
        if (dependency === 'api/notification') return { openNotification: notice => calls.notices.push(notice) };
        if (dependency === 'config') return { APP_DEFAULT_PATH: '/home' };
        if (dependency.startsWith('components/') || dependency.startsWith('./')) return () => null;
        if (dependency === 'jspdf') return { __esModule: true, default: Pdf };
        if (dependency === 'jspdf-autotable') return { __esModule: true, default: doc => { doc.lastAutoTable = { finalY: 80 }; } };
        assert.fail(`Unexpected dependency ${dependency}`);
      }
    });
    return module.exports.default;
  }
  const Detail = load('detail.js');
  return {
    calls,
    renderDetail() { cursor = 0; effects.length = 0; const tree = Detail(); effects.splice(0).forEach(effect => effect()); return tree; },
    renderList(rows) { return load('list.js')({ rows }); }
  };
}

test('paid rows show an icon-only print link immediately before Detail; pending rows do not', async () => {
  const f = await fixture();
  const tree = f.renderList([{ id: 1, status: 'paid', kdbayar: 'BB-1' }, { id: 2, status: 'pending', kdbayar: 'BB-2' }]);
  const rows = walk(tree).filter(node => node.type === 'tr' && React.Children.toArray(node.props.children).some(cell => cell.type === 'td'));
  const paidActions = walk(rows[0]).filter(node => node.type === 'IconButton' || node.type === 'Button');
  assert.equal(paidActions[0].type, 'IconButton');
  assert.equal(paidActions[0].props.href, '/orders-payments/1?print=1');
  assert.equal(paidActions[0].props.target, '_blank');
  assert.equal(paidActions[0].props.rel, 'noopener noreferrer');
  assert.equal(paidActions[0].props['aria-label'], 'Cetak pembayaran BB-1');
  assert.ok(React.isValidElement(paidActions[0].props.children));
  assert.equal(paidActions[1].props.children, 'Detail');
  assert.equal(walk(rows[1]).filter(node => node.type === 'IconButton').length, 0);
  assert.equal(walk(rows[1]).find(node => node.type === 'Button').props.children, 'Bayar');
});

test('print link generates the detail PDF once and uses the already opened tab', async () => {
  const f = await fixture({ query: '?print=1' });
  f.renderDetail();
  await flush();
  f.renderDetail();
  await flush();
  assert.deepEqual(f.calls.fetch, ['16851']);
  assert.equal(f.calls.autoPrint, 1);
  assert.deepEqual(f.calls.navigate, ['blob:payment-pdf']);
  assert.equal(f.calls.open.length, 0, 'must not open another popup after async PDF generation');
  assert.equal(f.calls.notices.length, 0);
});

test('automatic printing waits for data and ignores pending or failed detail requests', async () => {
  for (const options of [{ paid: false }, { error: new Error('Forbidden') }]) {
    const f = await fixture({ query: '?print=1', ...options });
    f.renderDetail();
    await flush();
    assert.equal(f.calls.fetch.length, 0);
  }
  const options = { query: '?print=1', loading: true };
  const f = await fixture(options);
  f.renderDetail();
  await flush();
  assert.equal(f.calls.fetch.length, 0);
  options.loading = false;
  f.renderDetail();
  await flush();
  assert.equal(f.calls.autoPrint, 1);
});

test('failed automatic printing shows an error and does not retry on every render', async () => {
  const f = await fixture({ query: '?print=1', printError: true });
  f.renderDetail();
  await flush();
  f.renderDetail();
  await flush();
  assert.equal(f.calls.fetch.length, 1);
  assert.equal(f.calls.navigate.length, 0);
  assert.equal(f.calls.notices[0].title, 'Gagal Print');
});

test('normal detail visits still print only when the existing Print button is clicked', async () => {
  const f = await fixture();
  const tree = f.renderDetail();
  await flush();
  assert.equal(f.calls.fetch.length, 0);
  const card = walk(tree).find(node => node.props.secondary);
  const button = walk(card.props.secondary).find(node => node.type === 'Button');
  await button.props.onClick();
  assert.equal(f.calls.autoPrint, 1);
  assert.deepEqual(f.calls.open, [['blob:payment-pdf', '_blank']]);
  assert.equal(f.calls.navigate.length, 0);
});
