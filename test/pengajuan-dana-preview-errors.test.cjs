const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const req = createRequire(path.join(root, 'package.json'));
const ts = req('typescript');
const React = req('react');
const { renderToString } = req('react-dom/server');
const { ThemeProvider, createTheme } = req('@mui/material/styles');
const theme = createTheme({ customShadows: { z1: 'none' } });
let rows = [];
let forbiddenApiCalls = 0;
const noop = () => {};
const failSend = () => { forbiddenApiCalls++; throw new Error('Unexpected network/send during preview render'); };
function load(relative, cache = new Map()) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, allowJs: true }, fileName: file.replace(/\.js$/, '.jsx')
  }).outputText;
  const localRequire = (id) => {
    if (id === 'api/pengajuan-dana') return { usePengajuanDanaAccess: () => ({ permissions: { can_read: true }, loading: false, error: null }), submitPengajuanDanaHermes: failSend, getPengajuanDanaHermesStatus: failSend };
    if (id === 'next/navigation') return { useRouter: () => ({ push: noop }) };
    if (id === 'next/link') return ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'components/@extended/Breadcrumbs') return () => React.createElement('nav', null, 'Preview Pengiriman Pengajuan Dana');
    if (id === 'hooks/useConfig') return { useThemeConfig: () => ({ themeContrast: false }) };
    if (id === 'config') return { ThemeMode: { DARK: 'dark' }, APP_DEFAULT_PATH: '/home' };
    // Only external data/context hooks are injected. Controller, validation helpers,
    // preview view, MainCard, React renderer and MUI are the actual source/modules.
    if (id === './usePengajuanDanaPollSelection') return () => ({ key: 'synthetic', ready: true, error: '', data: { items: rows.map(r => ({ id: String(r.id), kode: r.kode })), sender_phone: '', recipient_phone: '' }, savePhones: noop, savePrepared: noop, reset: noop, selectRows: noop });
    if (id === './usePengajuanDanaPollDetails') return () => ({ rows, errors: {}, loading: false, reload: noop });
    if (id === 'components/MainCard') return load('src/components/MainCard.js', cache);
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), id.endsWith('.js') ? id : id + '.js')), cache);
    return req(id);
  };
  vm.runInThisContext(`(function(require,module,exports,__filename,__dirname){${source}\n})`, { filename: file })(localRequire, module, module.exports, file, path.dirname(file));
  return module.exports;
}
const Preview = load('src/views/accounting/pengajuan-dana/poll-preview.js').default;
const valid = { id: 1, kode: 'PD-SYNTHETIC-ONLY', trx_date: '2026-11-05', total: '100.00', status: 'approval', bisnis: { name: 'Synthetic unit' }, cabang: { nama: 'Synthetic branch' }, items: [{ id: 1, qty: '1', harga: '100.00', grandtotal: '100.00', aktif: 'Y' }] };
function render(fixture) {
  rows = fixture; forbiddenApiCalls = 0;
  const html = renderToString(React.createElement(ThemeProvider, { theme }, React.createElement(Preview)));
  assert.equal(forbiddenApiCalls, 0, 'Preview render must not contact Hermes or send a message');
  return html;
}
function assertCannotSend(html) {
  const button = html.match(/<button\b[^>]*\bid="pd-send-data"[^>]*>/)?.[0];
  assert.ok(button, 'The preview send control must still render');
  assert.match(button, /\bdisabled\b/, 'An invalid document must block all delivery modes');
}

test('empty selection still renders the selection prompt', () => {
  assert.match(render([]), /Belum ada Pengajuan Dana terpilih/);
});

test('valid data still renders its detail without any outbound request', () => {
  const html = render([valid]);
  assert.match(html, /PD-SYNTHETIC-ONLY/);
  const button = html.match(/<button\b[^>]*\bid="pd-send-data"[^>]*>/)?.[0];
  assert.ok(button);
  assert.doesNotMatch(button, /\bdisabled\b/, 'Valid documents must not be blocked by the new validation boundary');
});

test('invalid source date renders a document validation alert instead of crashing the preview', () => {
  let html;
  assert.doesNotThrow(() => { html = render([{ ...valid, trx_date: '0000-00-00' }]); });
  assert.match(html, /Tanggal Pengajuan Dana tidak valid/);
  assert.match(html, /PD-SYNTHETIC-ONLY/);
  assert.doesNotMatch(html, /Internal Server Error/);
  assertCannotSend(html);
});

test('missing source items render a recoverable per-document error', () => {
  const html = render([{ ...valid, items: null }]);
  assert.match(html, /Rincian PD-SYNTHETIC-ONLY belum tersedia/);
  assertCannotSend(html);
});

test('unsupported precision stays rejected without rounding or a global error page', () => {
  const fixture = { ...valid, items: [{ ...valid.items[0], harga: '100.001' }] };
  const before = JSON.stringify(fixture);
  const html = render([fixture]);
  assert.match(html, /Harga item PD-SYNTHETIC-ONLY memiliki lebih dari 2 desimal/);
  assert.equal(JSON.stringify(fixture), before, 'Validation must not change source amounts');
  assertCannotSend(html);
});

test('a mixed selection keeps valid documents visible but blocks partial delivery', () => {
  const html = render([valid, { ...valid, id: 2, kode: 'PD-SYNTHETIC-BAD', trx_date: '0000-00-00' }]);
  assert.match(html, /PD-SYNTHETIC-ONLY/);
  assert.match(html, /PD-SYNTHETIC-BAD/);
  assert.match(html, /Tanggal Pengajuan Dana tidak valid/);
  assertCannotSend(html);
});
