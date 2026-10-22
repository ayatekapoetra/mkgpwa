const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { webcrypto } = require('node:crypto');
const Ajv = require('ajv'); // Already used by the project's ESLint dependencies.
const { transform } = require('next/dist/build/swc');

const base = 'src/views/scm/purchasing-orders/';
const files = [base + 'polling.js', base + 'use-poll-selection.js', base + 'use-poll-details.js', base + 'list.js', base + 'index.js', base + 'poll-preview.js', base + 'poll-preview-view.js', 'src/api/purchase-orders.js'];
const compiled = Promise.all(files.map(async (file) => [file, (await transform(
  fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
  { filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' }, module: { type: 'commonjs' } }
)).code])).then(Object.fromEntries);
const plain = (value) => JSON.parse(JSON.stringify(value));
const flush = () => new Promise((resolve) => setImmediate(resolve));
const metadata = { request_id: 'b6ea9e86-2123-423f-9a93-9203952a390a', created_at: '2026-10-22T10:00:00.000Z' };
const phones = { sender_phone: '081234567890', recipient_phone: '+6289876543210' };
const order = (id, extra = {}) => ({ id, kdpo: `PO-${id}`, status: 'verify', request_date: '2026-10-22', grandtotal: '0.10', items: [{ id: 501, qty: '10', barang: { kode: 'B-1', nama: 'Filter', satuan: 'PCS' } }], ...extra });

async function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext((await compiled)[file], {
    module, exports: module.exports, React, console, crypto: webcrypto, TextEncoder, AbortController, URLSearchParams, Blob,
    ...globals,
    require(name) { if (name in dependencies) return dependencies[name]; throw new Error(`Unexpected dependency: ${name}`); }
  });
  return module.exports;
}
const helpers = () => load(base + 'polling.js');

function hookRuntime() {
  const slots = [];
  const effects = [];
  let cursor = 0;
  const useMemo = (factory, deps) => {
    const index = cursor++;
    if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) slots[index] = { deps, value: factory() };
    return slots[index].value;
  };
  return {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) {
          const slot = { value: typeof initial === 'function' ? initial() : initial };
          slot.set = (value) => { slot.value = typeof value === 'function' ? value(slot.value) : value; };
          slots[index] = slot;
        }
        return [slots[index].value, slots[index].set];
      },
      useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index]; },
      useMemo,
      useCallback: (callback, deps) => useMemo(() => callback, deps),
      useEffect(callback, deps) {
        const index = cursor++;
        const previous = slots[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
        }
      }
    },
    render(callback) { cursor = 0; const result = callback(); effects.splice(0).forEach((effect) => effect()); return result; },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); }
  };
}

function browserStorage() {
  const values = new Map();
  const listeners = new Map();
  let writes = 0;
  let rejectWrites = false;
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) { if (rejectWrites) throw new Error('Storage quota exceeded'); writes++; values.set(key, value); },
    removeItem: (key) => values.delete(key)
  };
  const window = {
    localStorage,
    addEventListener(name, listener) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener); },
    removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
    dispatchEvent: (event) => listeners.get(event.type)?.forEach((listener) => listener(event))
  };
  return { values, window, get writes() { return writes; }, failWrites: () => { rejectWrites = true; } };
}

async function selectionFixture(browser = browserStorage()) {
  const h = hookRuntime();
  let session = { status: 'authenticated', data: { id: 1 } };
  const p = await helpers();
  const { default: hook } = await load(base + 'use-poll-selection.js', {
    react: h.react, 'next-auth/react': { useSession: () => session }, './polling': p
  }, { window: browser.window, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } } });
  return { browser, p, render: () => h.render(hook), switchUser: (id) => { session = id == null ? { status: 'unauthenticated', data: null } : { status: 'authenticated', data: { id } }; }, unmount: h.unmount };
}

test('selection persists across remounts/pages; select-all only affects current page; no initial empty overwrite', async () => {
  const f = await selectionFixture();
  assert.equal(f.render().ready, false);
  let s = f.render();
  assert.equal(s.ready, true);
  assert.equal(f.browser.writes, 0);
  s.selectRows([order(1), order(2)], true);
  f.render().selectRows([order(3)], true);
  f.render().selectRows([order('2')], true);
  assert.equal(f.render().data.items.length, 3);
  f.render().selectRows([order(1), order(2)], false);
  assert.deepEqual(plain(f.render().data.items), [{ id: '3', kdpo: 'PO-3' }]);
  f.unmount();
  const restored = await selectionFixture(f.browser);
  restored.render();
  assert.equal(restored.render().data.items[0].id, '3');
});

test('user switch/logout never exposes another user selection; reset is scoped to this feature', async () => {
  const f = await selectionFixture();
  f.browser.values.set('other-feature', 'keep');
  f.render();
  f.render().selectRows([order(1)], true);
  f.switchUser(2);
  assert.equal(f.render().data.items.length, 0);
  f.render().selectRows([order(2)], true);
  f.render().reset();
  assert.equal(f.browser.values.get('other-feature'), 'keep');
  assert.ok(f.browser.values.has(f.p.pollStorageKey(1)));
  f.switchUser(1);
  f.render();
  assert.equal(f.render().data.items[0].id, '1');
  f.switchUser(null);
  assert.equal(f.render().data.items.length, 0);
});

test('storage failure does not pretend that a new selection was saved; corrupt state can be reset', async () => {
  const f = await selectionFixture();
  f.render();
  f.render().selectRows([order(1)], true);
  f.browser.failWrites();
  assert.equal(f.render().selectRows([order(2)], true), false);
  assert.equal(f.render().data.items.length, 1);
  assert.match(f.render().error, /quota/);
  const b = browserStorage();
  b.values.set(f.p.pollStorageKey(1), '{broken');
  const corrupt = await selectionFixture(b);
  corrupt.render();
  assert.ok(corrupt.render().error);
  assert.equal(corrupt.render().reset(), true);
  assert.equal(corrupt.render().error, '');
});

test('external storage changes synchronize selection, and preparing after another tab resets fails', async () => {
  const f = await selectionFixture();
  f.render();
  let s = f.render();
  const data = f.p.selectPollRows(f.p.emptyPollSelection(), [order(9)], true);
  f.browser.values.set(s.key, JSON.stringify(data));
  f.browser.window.dispatchEvent({ type: 'storage', key: s.key });
  s = f.render();
  assert.equal(s.data.items[0].id, '9');
  f.browser.values.delete(s.key);
  assert.equal(s.savePrepared(metadata, phones, f.p.selectionSignature(s.data.items)), false);
});

test('phone normalization accepts Indonesian/international formats and rejects malformed destinations', async () => {
  const p = await helpers();
  for (const phone of ['0812-3456-7890', '6281234567890', '+62 (812) 3456 7890']) assert.equal(p.normalizeWhatsAppPhone(phone), '+6281234567890');
  assert.equal(p.normalizeWhatsAppPhone('+14155552671'), '+14155552671');
  for (const phone of ['', '123', '++6281234567890', '+0123456789', '0812abc567890', '+1234567890123456']) assert.throws(() => p.normalizeWhatsAppPhone(phone));
});

test('list toggles Pilih Data to Preview and keeps choices when page/filter changes', async () => {
  const p = await helpers();
  const h = hookRuntime();
  let data = p.emptyPollSelection();
  const Page = (await load(base + 'index.js', {
    react: h.react, 'next/link': 'NextLink', '@mui/material': mui(),
    'iconsax-react': { Export: 'ExportIcon', Filter: 'FilterIcon' },
    'api/purchase-orders': {
      usePurchaseOrderAccess: () => ({ permissions: { can_read: true } }),
      useGetPurchaseOrders: (params) => ({ rows: [order(params.page)], page: params.page, perPage: 25, total: 50, lastPage: 2, loading: false })
    },
    'api/notification': {}, 'components/@extended/Breadcrumbs': 'Breadcrumbs', 'components/MainCard': 'MainCard',
    'components/Paginate': 'Paginate', config: { APP_DEFAULT_PATH: '/home' },
    './filter': 'PurchaseOrderFilter', './list': 'PurchaseOrderList',
    './use-poll-selection': () => ({ ready: true, data, selectRows: (rows, checked) => { data = p.selectPollRows(data, rows, checked); } })
  })).default;
  const render = () => h.render(() => walk(Page()));
  let nodes = render();
  nodes.find((node) => node.type === 'Button' && text(node) === 'Pilih Data').props.onClick();
  nodes = render();
  const list = nodes.find((node) => node.type === 'PurchaseOrderList');
  assert.equal(list.props.selectionMode, true);
  list.props.onSelect(list.props.rows, true);
  nodes = render();
  const preview = nodes.find((node) => node.type === 'Button' && text(node) === 'Preview (1)');
  assert.equal(preview.props.href, '/purchasing-orders/preview');
  nodes.find((node) => node.type === 'Paginate').props.onPageChange(2);
  nodes = render();
  assert.equal(nodes.find((node) => node.type === 'PurchaseOrderList').props.rows[0].id, 2);
  assert.equal(nodes.find((node) => node.type === 'PurchaseOrderList').props.selectedIds.has('1'), true);
  nodes.find((node) => node.type === 'PurchaseOrderFilter').props.onApply({ status: 'verify' });
  nodes = render();
  assert.equal(nodes.find((node) => node.type === 'PurchaseOrderList').props.selectedIds.has('1'), true);
});

test('preview detail fetching is access-gated and cancels the previous user scope', async () => {
  const p = await helpers();
  const h = hookRuntime();
  const calls = [];
  const selection = { key: 'user-1', ready: true, data: { items: [{ id: '1' }] } };
  const { default: hook } = await load(base + 'use-poll-details.js', {
    react: h.react, './polling': p,
    'api/purchase-orders': { getPurchaseOrderForPoll: (id, { signal }) => new Promise((resolve) => { calls.push({ id, signal, resolve }); }) }
  });
  h.render(() => hook(selection, false));
  assert.equal(calls.length, 0);
  h.render(() => hook(selection, true));
  assert.equal(calls.length, 1);
  selection.key = 'user-2';
  assert.equal(h.render(() => hook(selection, true)).rows.length, 0);
  assert.equal(calls[0].signal.aborted, true);
  calls[0].resolve(order(1, { grandtotal: '1.00' }));
  calls[1].resolve(order(1, { grandtotal: '2.00' }));
  await flush();
  const result = h.render(() => hook(selection, true));
  assert.equal(result.rows[0].grandtotal, '2.00');
  h.unmount();
});

test('one poll covers all POs, filters inactive lines, and sums decimals/currencies exactly', async () => {
  const p = await helpers();
  const body = p.buildPollBody([
    order(1, { items: [{ id: 1, qty: 2 }, { id: 2, qty: 99, aktif: 'N' }] }),
    order(2, { grandtotal: '0.20' }),
    order(3, { currency: 'USD', grandtotal: '9999999999999999.99' }),
    order(4, { currency: 'USD', grandtotal: '0.01' })
  ], phones);
  assert.equal(body.items.length, 4);
  assert.equal(body.items[0].line_items.length, 1);
  assert.equal(body.poll.allow_multiple_answers, false);
  assert.equal(body.poll.scope, 'all_selected_purchase_orders');
  assert.equal(body.poll.options.length, 3);
  assert.deepEqual(plain(body.summary.totals_by_currency), [{ currency: 'IDR', amount: '0.30' }, { currency: 'USD', amount: '10000000000000000.00' }]);
  assert.equal(body.result_handling.update_purchase_orders, false);
  assert.equal(body.sender_phone, '+6281234567890');
  assert.equal(body.delivery.mode, 'pdf_poll');
  assert.equal(body.delivery.pdf_documents.length, 4);
  assert.equal(body.delivery.pdf_documents[0].source.path, '/scm/purchase-orders/1/print');
  for (const bad of [order(1, { grandtotal: null }), order(1, { grandtotal: '1.005' }), order(1, { items: undefined }), order(1, { request_date: '2026-02-30' })]) assert.throws(() => p.buildPollBody([bad], phones));
  assert.throws(() => p.buildPollBody([order(1), order(1)], phones), /duplikat/);
});

test('PDF and text modes require only the recipient and never include a poll or vote reporting', async () => {
  const p = await helpers();
  const rows = [order(1), order(2, { grandtotal: '0.20' })];
  const pdf = p.buildPollBody(rows, { recipient_phone: phones.recipient_phone }, 'pdf');
  assert.equal(pdf.sender_phone, null);
  assert.equal(pdf.poll, null);
  assert.equal(pdf.delivery.pdf_documents.length, 2);
  assert.equal(pdf.delivery.pdf_documents[1].file_name, 'purchase-order-2.pdf');
  assert.equal(pdf.delivery.text, null);
  assert.deepEqual(plain(pdf.result_handling), { send_result_to: null, include_recommendation: false, update_purchase_orders: false });
  const text = p.buildPollBody(rows, { recipient_phone: phones.recipient_phone, sender_phone: 'invalid-unused-value' }, 'text');
  assert.equal(text.sender_phone, null);
  assert.equal(text.poll, null);
  assert.equal(text.delivery.pdf_documents.length, 0);
  assert.match(text.delivery.text, /PO-1/);
  assert.match(text.delivery.text, /PO-2/);
  assert.match(text.delivery.text, /Filter/);
  assert.match(text.delivery.text, /IDR 0,30/);
  assert.throws(() => p.buildPollBody(rows, { recipient_phone: phones.recipient_phone }, 'pdf_poll'), /nomor WhatsApp/);
  assert.throws(() => p.buildPollBody(rows, phones, 'unsupported'), /Mode pengiriman/);
});

test('unchanged JSON reuses idempotency metadata; changed content or numbers creates a new request', async () => {
  const p = await helpers();
  const first = await p.preparePollPayload([order(1)], phones, null, metadata);
  const nextMetadata = { request_id: '917b408f-96c8-4407-8bdf-d319ee327cda', created_at: '2026-10-23T10:00:00.000Z' };
  const same = await p.preparePollPayload([order(1)], { ...phones, sender_phone: '+6281234567890' }, first.prepared, nextMetadata);
  assert.equal(same.payload.request_id, first.payload.request_id);
  assert.equal(same.payload.created_at, first.payload.created_at);
  const changed = await p.preparePollPayload([order(1, { grandtotal: '9.00' })], phones, first.prepared, nextMetadata);
  assert.equal(changed.payload.request_id, nextMetadata.request_id);
  const changedPhone = await p.preparePollPayload([order(1)], { ...phones, recipient_phone: '+6289999999999' }, first.prepared, nextMetadata);
  assert.equal(changedPhone.payload.request_id, nextMetadata.request_id);
  const changedMode = await p.preparePollPayload([order(1)], phones, first.prepared, nextMetadata, 'text');
  assert.equal(changedMode.payload.request_id, nextMetadata.request_id);
});

test('detail loader bounds concurrency, preserves order, surfaces missing PO and stops scheduling after abort', async () => {
  const p = await helpers();
  let active = 0;
  let max = 0;
  const ids = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const result = await p.loadSelectedPollOrders(ids, async (id) => {
    max = Math.max(max, ++active);
    await flush();
    active--;
    if (id === '5') throw new Error('not found');
    return order(id);
  }, new AbortController().signal);
  assert.equal(max, 4);
  assert.equal(result.rows[0].id, '1');
  assert.equal(result.rows[4].id, '6');
  assert.equal(result.errors['5'], 'not found');
  const controller = new AbortController();
  let calls = 0;
  await p.loadSelectedPollOrders(ids, async (id) => { calls++; controller.abort(); return order(id); }, controller.signal, 1);
  assert.equal(calls, 1);
});

test('generated JSON and examples conform to the published schemas; native poll and notify-only policy are enforced', async () => {
  const p = await helpers();
  const docRoot = path.resolve(__dirname, '../docs/purchasing/polling');
  const contract = JSON.parse(fs.readFileSync(path.join(docRoot, 'openapi.json'), 'utf8'));
  const example = JSON.parse(fs.readFileSync(path.join(docRoot, 'request.example.json'), 'utf8'));
  const vote = JSON.parse(fs.readFileSync(path.join(docRoot, 'vote.example.json'), 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  const requestSchema = ajv.compile({ $ref: '#/components/schemas/PollRequest', components: contract.components });
  const voteSchema = ajv.compile({ $ref: '#/components/schemas/PollVoteUpdate', components: contract.components });
  const { payload } = await p.preparePollPayload([order(1)], phones, null, metadata);
  assert.equal(requestSchema(plain(payload)), true, JSON.stringify(requestSchema.errors));
  assert.equal(requestSchema(example), true, JSON.stringify(requestSchema.errors));
  for (const mode of ['pdf', 'pdf_poll', 'text']) {
    const generated = await p.preparePollPayload([order(1)], phones, null, metadata, mode);
    assert.equal(requestSchema(plain(generated.payload)), true, JSON.stringify(requestSchema.errors));
  }
  for (const file of ['request.pdf.example.json', 'request.text.example.json']) {
    const sample = JSON.parse(fs.readFileSync(path.join(docRoot, file), 'utf8'));
    assert.equal(requestSchema(sample), true, JSON.stringify(requestSchema.errors));
  }
  const textRequest = plain((await p.preparePollPayload([order(1)], phones, null, metadata, 'text')).payload);
  assert.equal(requestSchema({ ...textRequest, poll: payload.poll }), false, 'text must not include a poll');
  assert.equal(requestSchema({ ...textRequest, delivery: { ...textRequest.delivery, pdf_documents: payload.delivery.pdf_documents } }), false, 'text must not attach PDFs');
  assert.equal(requestSchema({ ...plain(payload), delivery: { ...payload.delivery, pdf_documents: [] } }), false, 'PDF/poll requires document references');
  assert.equal(voteSchema(vote), true, JSON.stringify(voteSchema.errors));
  assert.equal(requestSchema({ ...plain(payload), result_handling: { ...payload.result_handling, update_purchase_orders: true } }), false);
  assert.equal(voteSchema({ ...vote, selected_option_ids: [] }), true);
  assert.equal(voteSchema({ ...vote, selected_option_ids: ['approve', 'reject'] }), false);
});

function walk(node) {
  if (!React.isValidElement(node)) return [];
  if (node.type === 'Menu' && !node.props.open) return [node];
  if (typeof node.type === 'function') return walk(node.type(node.props));
  return [node, ...[node.props.children, node.props.secondary, node.props.control, node.props.action, node.props.primary].flatMap((value) => React.Children.toArray(value).flatMap(walk))];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return React.Children.toArray(node.props?.children).map(text).join('');
}
const mui = (mobile = false) => new Proxy({ useTheme: () => ({ breakpoints: { down: () => 'md' } }), useMediaQuery: () => mobile }, {
  get: (target, name) => name === '__esModule' ? false : target[name] || name
});

for (const mobile of [false, true]) {
  test(`checkboxes support row/page selection and indeterminate state on ${mobile ? 'mobile' : 'desktop'}`, async () => {
    const calls = [];
    const { default: List } = await load(base + 'list.js', {
      'next/link': 'NextLink', '@mui/icons-material/LinkOutlined': 'LinkIcon', '@mui/material': mui(mobile),
      moment: require('moment'), 'moment/locale/id': {}, './components/StatusChip': 'StatusChip', './utils': { formatCurrency: String }
    });
    const nodes = walk(List({ rows: [order(1), order(2)], selectionMode: true, selectedIds: new Set(['1', '9']), onSelect: (...args) => calls.push(args) }));
    const boxes = nodes.filter((node) => node.type === 'Checkbox');
    const all = boxes.find((node) => node.props.inputProps['aria-label'] === 'Pilih semua PO di halaman ini');
    assert.equal(all.props.indeterminate, true);
    all.props.onChange(null, true);
    assert.deepEqual(calls[0][0].map((row) => row.id), [1, 2]);
    const second = boxes.find((node) => node.props.inputProps['aria-label'] === 'Pilih PO PO-2');
    second.props.onChange(null, true);
    assert.equal(calls[1][0][0].id, 2);
    assert.equal(calls[1][1], true);
  });
}

test('preview dropdown exports each requested mode, validates polling contacts, and resets selection', async () => {
  const p = await helpers();
  const h = hookRuntime();
  const rows = [order(1)];
  let selectionData = p.selectPollRows(p.emptyPollSelection(), rows, true);
  let reset = 0;
  let navigation;
  const blobs = [];
  let downloads = 0;
  let focused;
  const view = (await load(base + 'poll-preview-view.js', {
    react: h.react, 'next/link': 'NextLink', '@mui/material': mui(),
    '@mui/material/styles': { alpha: (color) => color },
    'iconsax-react': new Proxy({}, { get: (_, name) => name }),
    'components/MainCard': 'MainCard', './polling': p,
    './utils': { getRelationName: () => 'Example', getStatusMeta: () => ({ label: 'Verify', color: 'info' }) }
  })).default;
  const Page = (await load(base + 'poll-preview.js', {
    react: h.react,
    'next/link': 'NextLink', 'next/navigation': { useRouter: () => ({ push: (url) => { navigation = url; } }) },
    uuid: { v4: () => metadata.request_id }, 'iconsax-react': { ArrowDown2: 'ArrowDown2' }, '@mui/material': mui(),
    'api/purchase-orders': { usePurchaseOrderAccess: () => ({ permissions: { can_read: true } }) },
    'components/@extended/Breadcrumbs': 'Breadcrumbs', 'components/MainCard': 'MainCard', config: { APP_DEFAULT_PATH: '/home' },
    './use-poll-selection': () => ({
      key: 'user-1', ready: true, data: selectionData, error: '',
      savePhones: (value) => { selectionData = { ...selectionData, ...value }; return true; },
      savePrepared: (prepared, value) => { selectionData = { ...selectionData, ...value, prepared }; return true; },
      reset: () => { reset++; return true; }
    }),
    './use-poll-details': () => ({ rows, errors: {}, loading: false, reload() {} }),
    './polling': p,
    './poll-preview-view': view,
    './utils': { formatCurrency: String, getRelationName: () => 'Example', getStatusMeta: () => ({ label: 'Verify' }) }
  }, {
    URL: { createObjectURL: (blob) => { blobs.push(blob); return 'blob:poll'; }, revokeObjectURL() {} },
    document: { body: { appendChild() {} }, createElement: () => ({ click() { downloads++; }, remove() {} }), getElementById: (id) => ({ focus() { focused = id; } }) },
    setTimeout: (callback) => callback()
  })).default;
  const render = () => h.render(() => walk(Page()));
  render();
  let nodes = render();
  assert.equal(nodes.some((node) => text(node).includes('Banyak PO. Satu keputusan.')), false);
  const choose = async (label) => {
    nodes = render();
    nodes.find((node) => node.type === 'Button' && text(node) === 'Kirim Data').props.onClick({ currentTarget: {} });
    nodes = render();
    const menu = nodes.find((node) => node.type === 'Menu');
    assert.equal(menu.props.open, true);
    const options = nodes.filter((node) => node.type === 'MenuItem');
    assert.equal(options.length, 3);
    await options.find((node) => node.props.children.find((child) => child.type === 'ListItemText')?.props.primary === label).props.onClick();
  };
  await choose('Kirim PDF dan Polling');
  assert.equal(downloads, 0);
  assert.equal(focused, 'po-poll-recipient');
  nodes = render();
  assert.ok(nodes.find((node) => node.type === 'TextField' && node.props.label === 'Nomor penerima pesan').props.error);
  nodes.find((node) => node.type === 'TextField' && node.props.label === 'Nomor penerima pesan').props.onChange({ target: { value: phones.recipient_phone } });
  await choose('Kirim PDF');
  assert.equal(downloads, 1);
  const pdf = JSON.parse(await blobs[0].text());
  assert.equal(pdf.delivery.mode, 'pdf');
  assert.equal(pdf.poll, null);
  assert.equal(pdf.sender_phone, null);
  await choose('Kirim Pesan Text Saja');
  assert.equal(downloads, 2);
  const textOnly = JSON.parse(await blobs[1].text());
  assert.equal(textOnly.delivery.mode, 'text');
  assert.equal(textOnly.delivery.pdf_documents.length, 0);
  assert.match(textOnly.delivery.text, /PO-1/);
  await choose('Kirim PDF dan Polling');
  assert.equal(downloads, 2, 'polling still requires the result recipient');
  nodes = render();
  nodes.find((node) => node.type === 'TextField' && node.props.label === 'Nomor penerima hasil polling').props.onChange({ target: { value: phones.sender_phone } });
  nodes = render();
  await choose('Kirim PDF dan Polling');
  assert.equal(downloads, 3);
  const payload = JSON.parse(await blobs[2].text());
  assert.equal(payload.delivery.mode, 'pdf_poll');
  assert.equal(payload.sender_phone, '+6281234567890');
  assert.equal(payload.recipient_phone, phones.recipient_phone);
  assert.equal(payload.items[0].po_id, '1');
  assert.equal(payload.result_handling.update_purchase_orders, false);
  nodes = render();
  assert.ok(nodes.some((node) => node.type === 'Alert' && text(node).includes('Pesan WhatsApp belum dikirim')));
  nodes.find((node) => node.type === 'Button' && text(node) === 'Reset').props.onClick();
  assert.equal(reset, 1);
  assert.equal(navigation, '/purchasing-orders');
});

test('poll detail API uses existing endpoint, disables offline queue/retry, and rejects missing/mismatched documents', async () => {
  let reply = { status: 200, data: { diagnostic: { error: false }, rows: order(7) } };
  const signal = new AbortController().signal;
  const { getPurchaseOrderForPoll } = await load('src/api/purchase-orders.js', {
    react: {}, swr: () => {},
    'utils/axios': { get: async (url, config) => {
      assert.equal(url, '/scm/purchase-orders/7');
      assert.equal(config.signal, signal);
      assert.equal(config.skipOfflineQueue, true);
      assert.equal(config.retryCount, 0);
      return reply;
    } }
  });
  assert.equal((await getPurchaseOrderForPoll(7, { signal })).id, 7);
  reply = { status: 200, data: { diagnostic: { error: true, message: 'No access' } } };
  await assert.rejects(getPurchaseOrderForPoll(7, { signal }), /No access/);
  reply = { status: 200, data: { rows: order(9) } };
  await assert.rejects(getPurchaseOrderForPoll(7, { signal }), /tidak sesuai/);
  await assert.rejects(getPurchaseOrderForPoll('../x', { signal }), /tidak valid/);
});
