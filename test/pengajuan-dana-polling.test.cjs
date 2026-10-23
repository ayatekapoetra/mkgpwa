const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { webcrypto } = require('node:crypto');
const { transform } = require('next/dist/build/swc');

const base = 'src/views/accounting/pengajuan-dana/';
const files = [
  base + 'polling.js',
  base + 'usePengajuanDanaPollSelection.js',
  base + 'usePengajuanDanaPollDetails.js',
  base + 'list-desktop.js',
  base + 'list-mobile.js',
  base + 'list.js',
  base + 'index.js',
  base + 'poll-preview.js',
  base + 'poll-preview-view.js',
  'src/api/pengajuan-dana.js'
];

const compiled = Promise.all(
  files.map(async (file) => [
    file,
    (
      await transform(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
        filename: file,
        jsc: {
          parser: { syntax: 'ecmascript', jsx: true },
          transform: { react: { runtime: 'classic' } },
          target: 'es2022'
        },
        module: { type: 'commonjs' }
      })
    ).code
  ])
).then(Object.fromEntries);

const plain = (value) => JSON.parse(JSON.stringify(value));
const metadata = {
  request_id: 'b6ea9e86-2123-423f-9a93-9203952a390a',
  created_at: '2026-10-23T10:00:00.000Z'
};
const phones = { sender_phone: '081234567890', recipient_phone: '+6281298765432' };

const samplePengajuan = (id, extra = {}) => ({
  id,
  kode: `PD-${String(id).padStart(4, '0')}`,
  status: 'approval',
  trx_date: '2026-10-23',
  narasi: `Pembayaran operasional #${id}`,
  total: '1500000',
  bisnis: { id: 1, name: 'PT Makkuraga Tama' },
  cabang: { id: 2, nama: 'Makassar' },
  creator: { id: 3, nama_lengkap: 'Staff Finance' },
  items: [
    {
      id: id * 10 + 1,
      narasi: 'Penggantian sparepart printer',
      qty: 2,
      satuan: 'UNIT',
      harga: '750000',
      grandtotal: '1500000',
      prioritas: 'P1',
      aktif: 'Y'
    }
  ],
  ...extra
});

async function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext((await compiled)[file], {
    module,
    exports: module.exports,
    React,
    console,
    crypto: webcrypto,
    TextEncoder,
    AbortController,
    URLSearchParams,
    Blob,
    ...globals,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    }
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
    if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) {
      slots[index] = { deps, value: factory() };
    }
    return slots[index].value;
  };

  return {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!slots[index]) {
          const slot = { value: typeof initial === 'function' ? initial() : initial };
          slot.set = (value) => {
            slot.value = typeof value === 'function' ? value(slot.value) : value;
          };
          slots[index] = slot;
        }
        return [slots[index].value, slots[index].set];
      },
      useRef(initial) {
        const index = cursor++;
        if (!slots[index]) slots[index] = { current: initial };
        return slots[index];
      },
      useMemo,
      useCallback: (callback, deps) => useMemo(() => callback, deps),
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
    },
    unmount() {
      slots.forEach((slot) => slot?.cleanup?.());
    }
  };
}

function browserStorage() {
  const values = new Map();
  const listeners = new Map();
  let writes = 0;
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) {
      writes++;
      values.set(key, value);
    },
    removeItem: (key) => values.delete(key)
  };
  const window = {
    localStorage,
    addEventListener(name, listener) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(listener);
    },
    removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
    dispatchEvent: (event) => listeners.get(event.type)?.forEach((listener) => listener(event))
  };
  return { values, window, get writes() { return writes; } };
}

async function selectionFixture(browser = browserStorage()) {
  const h = hookRuntime();
  let session = { status: 'authenticated', data: { id: 1 } };
  const p = await helpers();
  const { default: hook } = await load(
    base + 'usePengajuanDanaPollSelection.js',
    {
      react: h.react,
      'next-auth/react': { useSession: () => session },
      './polling': p
    },
    {
      window: browser.window,
      CustomEvent: class {
        constructor(type, init) {
          this.type = type;
          this.detail = init.detail;
        }
      }
    }
  );
  return {
    browser,
    p,
    render: () => h.render(hook),
    unmount: h.unmount
  };
}

test('phone normalization parses Indonesian local and international formats correctly', async () => {
  const { normalizeWhatsAppPhone } = await helpers();
  assert.equal(normalizeWhatsAppPhone('081234567890'), '+6281234567890');
  assert.equal(normalizeWhatsAppPhone('6281234567890'), '+6281234567890');
  assert.equal(normalizeWhatsAppPhone('+6281234567890'), '+6281234567890');
  assert.equal(normalizeWhatsAppPhone('0812-3456-7890'), '+6281234567890');

  assert.throws(() => normalizeWhatsAppPhone('12345'), /digit/);
  assert.throws(() => normalizeWhatsAppPhone(''), /nomor WhatsApp/);
});

test('storage key matches PRD and persists selections across remounts', async () => {
  const f = await selectionFixture();
  assert.equal(f.render().ready, false);
  const s = f.render();
  assert.equal(s.ready, true);
  assert.equal(s.key, 'mkg_pengajuan_dana_poll_selection');

  s.selectRows([samplePengajuan(1), samplePengajuan(2)], true);
  f.render().selectRows([samplePengajuan(3)], true);
  assert.equal(f.render().count, 3);
  assert.deepEqual(plain(f.render().selectedIds), [1, 2, 3]);

  f.render().selectRows([samplePengajuan(2)], false);
  assert.equal(f.render().count, 2);
  assert.deepEqual(plain(f.render().selectedIds), [1, 3]);

  f.unmount();
  const restored = await selectionFixture(f.browser);
  restored.render();
  assert.equal(restored.render().count, 2);
  assert.deepEqual(plain(restored.render().selectedIds), [1, 3]);
});

test('summarizePollItems aggregates totals by currency and counts', async () => {
  const { summarizePollItems, toPollItem } = await helpers();
  const row1 = samplePengajuan(1, { total: '1500000' });
  const row2 = samplePengajuan(2, { total: '2500000' });

  const items = [toPollItem(row1), toPollItem(row2)];
  const summary = summarizePollItems(items);

  assert.equal(summary.pengajuan_dana_count, 2);
  assert.equal(summary.totals_by_currency.length, 1);
  assert.equal(summary.totals_by_currency[0].currency, 'IDR');
  assert.equal(summary.totals_by_currency[0].amount, '4000000.00');
});

test('buildPollBody builds valid Hermes payload for all 3 delivery modes', async () => {
  const { buildPollBody } = await helpers();
  const rows = [samplePengajuan(1), samplePengajuan(2)];

  // 1. pdf_poll mode
  const pdfPollBody = buildPollBody(rows, phones, 'pdf_poll');
  assert.equal(pdfPollBody.delivery.mode, 'pdf_poll');
  assert.ok(pdfPollBody.poll);
  assert.equal(pdfPollBody.poll.options.length, 3);
  assert.equal(pdfPollBody.sender_phone, '+6281234567890');
  assert.equal(pdfPollBody.recipient_phone, '+6281298765432');
  assert.equal(pdfPollBody.items.length, 2);

  // 2. pdf mode
  const pdfBody = buildPollBody(rows, phones, 'pdf');
  assert.equal(pdfBody.delivery.mode, 'pdf');
  assert.equal(pdfBody.poll, null);

  // 3. text mode
  const textBody = buildPollBody(rows, phones, 'text');
  assert.equal(textBody.delivery.mode, 'text');
  assert.ok(typeof textBody.delivery.text === 'string' && textBody.delivery.text.length > 0);
  assert.equal(textBody.poll, null);
});

test('preparePollPayload wraps payload with metadata and enforces validation', async () => {
  const { preparePollPayload } = await helpers();
  const rows = [samplePengajuan(1)];

  const result = await preparePollPayload(rows, phones, null, metadata, 'pdf_poll');
  assert.ok(result.payload);
  assert.equal(result.payload.request_id, metadata.request_id);
  assert.equal(result.payload.created_at, metadata.created_at);
  assert.equal(result.payload.summary.pengajuan_dana_count, 1);
});
