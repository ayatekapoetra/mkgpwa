const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const poFile = 'src/views/scm/purchasing-orders/detail.js';
const reconFile = 'src/views/operational/timesheet-reconcil/index.jsx';
const compiled = Promise.all([poFile, reconFile].map(async (file) => [file, (await transform(
  fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
  { filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' }, module: { type: 'commonjs' } }
)).code])).then(Object.fromEntries);

const mui = new Proxy({}, { get: (_, key) => key === '__esModule' ? false : key });
function walk(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(walk)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return React.Children.toArray(node.props?.children).map(text).join('');
}
function hooks() {
  const slots = [];
  let cursor = 0;
  return {
    reset: () => { cursor = 0; },
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
        return [slots[index].value, (value) => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
      },
      useMemo: (factory) => factory()
    }
  };
}
async function load(file, deps) {
  const module = { exports: {} };
  vm.runInNewContext((await compiled)[file], {
    module, exports: module.exports, React, console,
    require(name) { if (name in deps) return deps[name]; throw new Error(`Unexpected dependency: ${name}`); }
  });
  return module.exports.default;
}

test('PO requests detail and permissions in parallel and displays the document while permissions load', async () => {
  const h = hooks();
  let permissionsLoading = true;
  let previewEnabled;
  const row = { id: 7, kdpo: 'PO-7', status: 'open', items: [] };
  const Page = await load(poFile, {
    react: h.react,
    'next/navigation': { useParams: () => ({ id: '7' }), useRouter: () => ({ push() {} }) },
    '@mui/material': mui,
    'api/purchase-orders': {
      usePurchaseOrderAccess: () => ({ permissions: { can_read: true } }),
      useShowPurchaseOrder: (id, enabled) => { assert.equal(id, '7'); assert.equal(enabled, true); return { row }; },
      usePurchaseOrderPermissions: (id, enabled) => {
        assert.equal(id, '7', 'permission lookup must not wait for row');
        assert.equal(enabled, true);
        return { permissions: { can_rollback: !permissionsLoading }, loading: permissionsLoading };
      },
      usePurchaseOrderRollbackPreview: (_, enabled) => { previewEnabled = enabled; return {}; },
      usePurchaseOrderReconciliation: () => ({}),
      usePurchaseOrderAuditTrail: () => ({ rows: [] })
    },
    'api/notification': {},
    'components/@extended/Breadcrumbs': 'Breadcrumbs', 'components/BtnBack': 'BtnBack', 'components/MainCard': 'MainCard',
    config: { APP_DEFAULT_PATH: '/home' },
    './components': Object.fromEntries(['ActionDialog', 'AttachmentCard', 'AuditTimeline', 'DocumentActions', 'DocumentHeader', 'DownstreamLinks', 'PurchaseOrderItemCard', 'RollbackDialog'].map((name) => [name, name])),
    './utils': { calculateHeaderTotals: () => ({ gross: 0, discount: 0, tax_amount: 0, grand_total: 0 }) }
  });
  const render = () => { h.reset(); return walk(Page()); };
  let nodes = render();
  assert.ok(nodes.some((node) => node.type === 'DocumentHeader'));
  assert.equal(nodes.some((node) => node.type === 'DocumentActions'), false);
  assert.equal(previewEnabled, false);
  permissionsLoading = false;
  nodes = render();
  const actions = nodes.find((node) => node.type === 'DocumentActions');
  assert.ok(actions);
  actions.props.onShowRollback();
  render();
  assert.equal(previewEnabled, true, 'preview is fetched only after opening rollback');
});

test('reconciliation paginates rendered rows but exports the entire result, loading XLSX on demand', async () => {
  const h = hooks();
  let imports = 0;
  let exportedRows;
  let saved = false;
  const rows = Array.from({ length: 60 }, (_, id) => ({ id, nmkaryawan: `Employee ${id}`, date_ops: '2026-10-22', items: [{ id, nmkaryawan: `Employee ${id}` }] }));
  const Page = await load(reconFile, {
    react: h.react,
    moment: require('moment'),
    '@mui/material': mui, '@mui/icons-material': mui,
    'components/OptionOperatorDriver': 'OptionOperatorDriver',
    'api/timesheet-reconcil': async () => ({ rows }),
    'next/link': 'NextLink', 'hooks/useUser': () => ({ role: 'developer' }),
    get xlsx() {
      imports++;
      return {
        utils: { aoa_to_sheet: (data) => { exportedRows = data; return {}; }, book_new: () => ({}), book_append_sheet() {} },
        writeFile() { saved = true; }
      };
    }
  });
  const render = () => { h.reset(); return walk(Page()); };
  let nodes = render();
  assert.equal(imports, 0);
  await nodes.find((node) => node.type === 'Button' && text(node) === 'Terapkan').props.onClick();
  nodes = render();
  let detailLinks = nodes.filter((node) => node.type === 'Button' && node.props.href?.startsWith('/timesheet-reconcil/'));
  assert.equal(detailLinks.length, 25);
  const pagination = nodes.find((node) => node.type === 'TablePagination');
  assert.equal(pagination.props.count, 60);
  pagination.props.onPageChange(null, 2);
  nodes = render();
  detailLinks = nodes.filter((node) => node.type === 'Button' && node.props.href?.startsWith('/timesheet-reconcil/'));
  assert.equal(detailLinks.length, 10);
  assert.equal(detailLinks[0].props.href, '/timesheet-reconcil/50');
  await nodes.find((node) => node.type === 'Button' && text(node) === 'Excel').props.onClick();
  assert.equal(imports, 1);
  assert.equal(saved, true);
  assert.ok(exportedRows.some((row) => row.includes('Employee 59')), 'export includes rows beyond the visible page');
});
