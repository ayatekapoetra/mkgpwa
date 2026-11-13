// Isolated contract/component tests: all API responses below are mocks, not E2E evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const React = require('react');

function load(file, mocks) {
  const filename = path.resolve(file);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, configFile: false, babelrc: false,
    presets: [[require.resolve('next/babel'), { 'preset-env': { targets: { node: 'current' }, modules: 'commonjs' }, 'preset-react': { runtime: 'automatic' } }]],
    envName: 'test',
  }).code;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
  mod._compile(code, filename);
  return mod.exports;
}

const mui = new Proxy({}, { get: (_, name) => name });
let slots = [], cursor = 0;
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (value) => { slots[index] = value; }];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
};
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
}
function button(tree, text) {
  const found = nodes(tree).find((node) => node.type === 'Button' && node.props.children === text);
  assert.ok(found, `Button ${text}`);
  return found;
}

async function main() {
  const calls = [];
  const api = load('src/api/faktur-pembelian.js', {
    react: { useMemo: (fn) => fn() }, swr: () => ({}),
    'utils/axios': { __esModule: true, default: {
      put: async (...args) => { calls.push(['put', ...args]); return { data: { rows: { ok: true } } }; },
      post: async (...args) => { calls.push(['post', ...args]); return { data: { rows: { ok: true } } }; },
    } },
  });
  const accessApi = load('src/api/faktur-pembelian.js', {
    react: { useMemo: (fn) => fn() },
    swr: () => ({ data: { rows: { permissions: { can_send_payment: 'Y', can_request_void: 1, can_approve_void: true, can_rollback: true } } } }),
    'utils/axios': {},
  });
  for (const flag of ['can_send_payment', 'can_request_void', 'can_approve_void', 'can_rollback']) {
    assert.equal(accessApi.useFakturPembelianAccess().permissions[flag], true, flag);
    assert.equal(api.useFakturPembelianAccess().permissions[flag], false, `${flag} defaults false`);
  }
  await api.updateFakturPembelian(7, { next_due_date: '2026-11-12', narasi: 'test', grandtotal: 999 });
  await api.sendFakturToPayment(7);
  await api.rollbackFakturPembelian(7, 'reason');
  await api.requestVoidFakturPembelian(7, 'reason');
  assert.deepEqual(calls.map((call) => call.slice(0, 3)), [
    ['put', '/scm/faktur-pembelian/7', { next_due_date: '2026-11-12', narasi: 'test' }],
    ['post', '/scm/faktur-pembelian/7/kirim-ke-pembayaran', {}],
    ['post', '/scm/faktur-pembelian/7/rollback', { reason: 'reason' }],
    ['post', '/scm/faktur-pembelian/7/request-void', { reason: 'reason' }],
  ]);
  calls.forEach((call) => assert.deepEqual(call[3], { skipOfflineQueue: true, skipRetry: true, timeout: 30000 }));
  const list = fs.readFileSync('src/views/scm/faktur-pembelian/list.js', 'utf8');
  const index = fs.readFileSync('src/views/scm/faktur-pembelian/index.js', 'utf8');
  assert.doesNotMatch(list + index, /Checkbox|setChecked|allChecked|onToggle|createPaymentPlans/);
  assert.match(list, /aria-label=\{`Detail faktur/);
  console.log('PASS API routes, payload whitelist, no retry/offline queue; AC-FPB-01 source regression');

  let voidData = { current: null, history: [] }, voidError, voidLoading = false, refreshCalls = 0, decisionCalls = [], resolveDecision;
  const refreshVoid = async () => { refreshCalls++; return voidData; };
  let resolvePayment, paymentCalls = 0, rollbackCalls = 0, voidCalls = 0, updatePayload, failUpdate = false;
  const Actions = load('src/views/scm/faktur-pembelian/DetailActions.js', {
    react: hooks, '@mui/material': mui,
    'api/faktur-pembelian': {
      useVoidRequests: () => ({ ...voidData, error: voidError, loading: voidLoading, refresh: refreshVoid }),
      decideVoidRequest: (...args) => { decisionCalls.push(args); return new Promise((resolve) => { resolveDecision = resolve; }); },
      sendFakturToPayment: () => { paymentCalls++; return new Promise((resolve) => { resolvePayment = resolve; }); },
      rollbackFakturPembelian: async (_, reason) => { rollbackCalls++; assert.equal(reason, 'Salah faktur'); },
      requestVoidFakturPembelian: async () => { voidCalls++; return { status: 'PENDING' }; },
      updateFakturPembelian: async (_, body) => { if (failUpdate) throw new Error('timeout'); updatePayload = body; },
    },
  }).default;
  let props = { id: 7, header: { has_payment: false, sisa: 100, planned: false, due_date: '2026-11-12', narasi: 'original' }, permissions: { can_update: true, can_send_payment: true, can_rollback: true, can_request_void: true }, refresh: async () => {} };
  const render = () => { cursor = 0; return Actions(props); };
  let tree = render();
  const first = button(tree, 'Kirim Ke Pembayaran').props.onClick();
  await button(tree, 'Kirim Ke Pembayaran').props.onClick();
  assert.equal(paymentCalls, 1, 'ref lock blocks same-tick double-submit');
  resolvePayment({ created: [{ payment_id: 1 }], failed: [] });
  await first;
  assert.equal(button(render(), 'Kirim Ke Pembayaran').props.disabled, true);
  slots = [];
  props.permissions.can_send_payment = false;
  props.header.planned = true;
  assert.equal(button(render(), 'Kirim Ke Pembayaran').props.disabled, true);
  props.header.planned = false; props.header.sisa = 0;
  assert.equal(button(render(), 'Kirim Ke Pembayaran').props.disabled, true);
  props.permissions.can_send_payment = true;
  assert.equal(button(render(), 'Kirim Ke Pembayaran').props.disabled, false, 'server flag authoritative, not client sisa');
  props.header.sisa = 100;
  tree = render();
  button(tree, 'Rollback').props.onClick(); tree = render();
  assert.equal(button(tree, 'Konfirmasi').props.disabled, true);
  nodes(tree).find((node) => node.type === 'TextField' && node.props.label === 'Alasan').props.onChange({ target: { value: '   ' } });
  assert.equal(button(render(), 'Konfirmasi').props.disabled, true);
  nodes(render()).find((node) => node.type === 'TextField' && node.props.label === 'Alasan').props.onChange({ target: { value: ' Salah faktur ' } });
  await nodes(render()).find((node) => node.props.component === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(rollbackCalls, 1);
  assert.equal(button(render(), 'Kirim Ke Pembayaran').props.disabled, true);
  assert.ok(nodes(render()).some((node) => typeof node.props?.children === 'string' && node.props.children.includes('PO/PD tetap close')));
  console.log('PASS AC-FPB-02 planned/sisa/double-submit; AC-FPB-04 required reason, soft-delete result');

  slots = []; props.header.has_payment = true; props.permissions.can_rollback = false;
  tree = render();
  assert.ok(!nodes(tree).some((node) => node.type === 'Button' && node.props.children === 'Rollback'));
  button(tree, 'Request Void').props.onClick(); tree = render();
  nodes(tree).find((node) => node.type === 'TextField' && node.props.label === 'Alasan').props.onChange({ target: { value: 'test void' } });
  await nodes(render()).find((node) => node.props.component === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(voidCalls, 1);
  assert.ok(nodes(render()).some((node) => node.props?.role === 'status'));
  slots = []; props.permissions = {};
  tree = render();
  assert.equal(button(tree, 'Kirim Ke Pembayaran').props.disabled, true);
  assert.ok(!nodes(tree).some((node) => node.type === 'Button' && ['Rollback', 'Request Void', 'Edit Jatuh Tempo / Narasi'].includes(node.props.children)));
  slots = []; props.permissions = { can_update: true };
  button(render(), 'Edit Jatuh Tempo / Narasi').props.onClick();
  tree = render();
  assert.deepEqual(nodes(tree).filter((node) => node.type === 'TextField').map((node) => node.props.label), ['Jatuh Tempo', 'Catatan / Narasi']);
  await nodes(tree).find((node) => node.props.component === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(updatePayload, { next_due_date: '2026-11-12', narasi: 'original' });
  console.log('PASS AC-FPB-03 two editable fields; AC-FPB-05 replacement, approval status; fail-closed permissions');
  await new Promise(setImmediate);
  failUpdate = true;
  button(render(), 'Edit Jatuh Tempo / Narasi').props.onClick();
  await nodes(render()).find((node) => node.props.component === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(button(render(), 'Edit Jatuh Tempo / Narasi').props.disabled, true);
  await button(render(), 'Muat ulang detail').props.onClick();
  assert.equal(button(render(), 'Edit Jatuh Tempo / Narasi').props.disabled, false);
  console.log('PASS timeout/error locks mutations until explicit detail refresh');

  const hasButton = (label) => nodes(render()).some((n) => n.type === 'Button' && n.props.children === label);
  const text = () => nodes(render()).flatMap((n) => React.Children.toArray(n.props?.children).filter((v) => typeof v === 'string')).join(' ');
  const pendingRow = { id: 22, status: 'PENDING', requested_by_nama: 'Maker Uji', reason: 'Alasan uji', requested_at: '2026-11-11 12:00:00' };
  voidData = { current: pendingRow, history: [pendingRow] };
  props.permissions = { can_approve_void: true };
  for (const [label, expected] of [['Setujui', 'APPROVED'], ['Tolak', 'REJECTED']]) {
    slots = [];
    assert.equal(hasButton('Request Void'), false);
    assert.ok(text().includes('PENDING'));
    button(render(), label).props.onClick();
    assert.equal(button(render(), 'Konfirmasi').props.disabled, true);
    await nodes(render()).find((n) => n.props.component === 'form').props.onSubmit({ preventDefault() {} });
    const before = decisionCalls.length;
    nodes(render()).find((n) => n.type === 'TextField' && n.props.label === 'Alasan').props.onChange({ target: { value: ' Pemeriksaan uji ' } });
    const form = nodes(render()).find((n) => n.props.component === 'form');
    const saving = form.props.onSubmit({ preventDefault() {} });
    await form.props.onSubmit({ preventDefault() {} });
    assert.equal(decisionCalls.length, before + 1, 'same-tick decision double submit blocked');
    assert.deepEqual(decisionCalls.at(-1), [7, 22, { decision: expected, reason: 'Pemeriksaan uji' }]);
    const refreshBefore = refreshCalls;
    resolveDecision({ status: expected });
    await saving;
    assert.ok(refreshCalls > refreshBefore);
  }
  slots = []; props.permissions = {};
  assert.equal(hasButton('Setujui'), false);
  assert.equal(hasButton('Tolak'), false);
  for (const status of ['APPROVED', 'REJECTED']) {
    slots = []; voidData = { current: null, history: [{ ...pendingRow, status, decided_at: '2026-11-11 13:00:00', decision_reason: 'Selesai' }] };
    assert.ok(text().includes(status), 'status survives remount from server history');
    assert.ok(text().includes('administratif saja'));
  }
  slots = []; voidData = { current: null, history: [] }; props.permissions = { can_request_void: true };
  voidLoading = true;
  assert.equal(button(render(), 'Request Void').props.disabled, true);
  voidLoading = false; voidError = Object.assign(new Error('schema'), { code: 'VOID_SCHEMA_MISSING' });
  assert.ok(text().includes('fitur belum tersedia'));
  assert.equal(button(render(), 'Request Void').props.disabled, true);
  voidError = new Error('403 Tidak diizinkan');
  assert.ok(text().includes('403 Tidak diizinkan'));
  voidError = undefined;
  console.log('PASS checker approve/reject, reason, permissions, double submit, refresh, persisted history, loading/schema/error');

  let apiFailure, swrArgs;
  const historyApi = load('src/api/faktur-pembelian.js', {
    react: { useMemo: (fn) => fn() },
    swr: (...args) => { swrArgs = args; return { data: voidData, mutate: refreshVoid }; },
    'utils/axios': { __esModule: true, default: {
      get: async (...args) => { calls.push(['get', ...args]); if (apiFailure) throw apiFailure; return { data: { rows: voidData } }; },
      post: async (...args) => { calls.push(['post', ...args]); if (apiFailure) throw apiFailure; return { data: { rows: { status: 'APPROVED' } } }; },
    } },
  });
  assert.deepEqual(await historyApi.fetchVoidRequests(7), voidData);
  assert.equal(calls.at(-1)[1], '/scm/faktur-pembelian/7/request-void');
  historyApi.useVoidRequests(7);
  assert.equal(swrArgs[0], '/scm/faktur-pembelian/7/request-void');
  assert.equal(swrArgs[2].shouldRetryOnError, false);
  await swrArgs[1]();
  historyApi.useVoidRequests(null); assert.equal(swrArgs[0], null);
  // DETAIL permissions must keep server flags via permissionDefaults/normalizePermissions.
  const detailApi = load('src/api/faktur-pembelian.js', {
    react: { useMemo: (fn) => fn() },
    swr: (key) => ({ data: key ? { rows: { header: { has_payment: true }, permissions: { can_send_payment: 'Y', can_request_void: 1, can_approve_void: true, can_rollback: 'TRUE' } } } : undefined }),
    'utils/axios': {},
  });
  assert.deepEqual(detailApi.useFakturPembelianDetail(7).row.permissions, {
    can_read: false, can_create: false, can_update: false, can_delete: false,
    can_send_payment: true, can_request_void: true, can_approve_void: true, can_rollback: true,
    can_export: false, can_reschedule_due_date: false, can_upload_attachment: false, can_replace_attachment: false, can_remove_attachment: false,
  });
  assert.equal(detailApi.useFakturPembelianDetail(null).row, null);
  await historyApi.decideVoidRequest(7, 22, { decision: 'APPROVED', reason: 'Uji', ignored: true });
  assert.deepEqual(calls.at(-1), ['post', '/scm/faktur-pembelian/7/request-void/22/decision', { decision: 'APPROVED', reason: 'Uji' }, { skipOfflineQueue: true, skipRetry: true, timeout: 30000 }]);
  for (const code of ['VOID_SCHEMA_MISSING', 'FORBIDDEN', 'CONFLICT', 'NOT_FOUND']) {
    apiFailure = { response: { data: { diagnostic: { code, error: 'Pesan server' } } } };
    await assert.rejects(historyApi.fetchVoidRequests(7), (err) => err.code === code && err.message === (code === 'VOID_SCHEMA_MISSING' ? 'fitur belum tersedia' : 'Pesan server'));
    await assert.rejects(historyApi.decideVoidRequest(7, 22, { decision: 'REJECTED', reason: 'Uji' }), (err) => err.code === code);
  }
  apiFailure = { diagnostic: { code: 'VOID_SCHEMA_MISSING', error: 'Schema missing' } };
  await assert.rejects(historyApi.fetchVoidRequests(7), /fitur belum tersedia/);
  await assert.rejects(historyApi.decideVoidRequest(7, 22, { decision: 'REJECTED', reason: 'Uji' }), /fitur belum tersedia/);
  console.log('PASS API history/decision contract, SWR key, diagnostics, permission normalization');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
