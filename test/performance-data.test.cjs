const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transform } = require('next/dist/build/swc');

const sessionFile = 'src/utils/session-cache.js';
const depsFile = 'src/views/warehouse/goods-issues/use-item-dependencies.js';
const compiled = Promise.all([sessionFile, depsFile].map(async (file) => [file, (await transform(
  fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
  { filename: file, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } }
)).code])).then(Object.fromEntries);
const flush = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

async function load(file, deps, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext((await compiled)[file], {
    module, exports: module.exports, URLSearchParams, AbortController, console, window: {}, ...globals,
    require(name) { if (name in deps) return deps[name]; throw new Error(`Unexpected dependency: ${name}`); }
  });
  return module.exports;
}

test('concurrent API requests share session lookup and respect TTL/provider updates', async () => {
  let now = 1000;
  let calls = 0;
  const lookup = deferred();
  const api = await load(sessionFile, { 'next-auth/react': { getSession: (options) => {
    calls++;
    assert.equal(options.broadcast, false);
    return lookup.promise;
  } } }, { Date: { now: () => now } });
  const requests = Array.from({ length: 20 }, () => api.getCachedSession());
  assert.equal(calls, 1);
  const session = { token: { accessToken: 'a' } };
  lookup.resolve(session);
  assert.ok((await Promise.all(requests)).every((result) => result === session));
  assert.strictEqual(await api.getCachedSession(), session);
  assert.equal(calls, 1);
  now += 60_001;
  await api.getCachedSession();
  assert.equal(calls, 2);
  const updated = { token: { accessToken: 'b' } };
  api.updateCachedSession(updated);
  assert.strictEqual(await api.getCachedSession(), updated);
  assert.equal(calls, 2);
});

test('sign-out wins over an outstanding session lookup', async () => {
  const lookup = deferred();
  const api = await load(sessionFile, { 'next-auth/react': { getSession: () => lookup.promise } });
  const request = api.getCachedSession();
  api.updateCachedSession(null);
  lookup.resolve({ token: { accessToken: 'old-user' } });
  assert.equal(await request, null);
  assert.equal(await api.getCachedSession(), null);
});

test('server-side API calls never reuse or fetch a browser session', async () => {
  const api = await load(sessionFile, { 'next-auth/react': { getSession: () => assert.fail('server must not fetch client session') } }, { window: undefined });
  api.updateCachedSession({ token: { accessToken: 'user-a' } });
  assert.equal(await api.getCachedSession(), null);
});

test('failed session lookups release the single-flight lock for the next request', async () => {
  let calls = 0;
  const api = await load(sessionFile, { 'next-auth/react': { getSession: async () => {
    if (++calls === 1) throw new Error('session unavailable');
    return null;
  } } });
  await assert.rejects(api.getCachedSession(), /session unavailable/);
  assert.equal(await api.getCachedSession(), null);
  assert.equal(calls, 2);
});

async function goodsFixture(responder = () => Promise.resolve({ data: { data: [{ id: 1 }] } })) {
  const slots = [];
  let cursor = 0;
  const effects = [];
  const calls = [];
  const updates = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) {
        const slot = { value: typeof initial === 'function' ? initial() : initial };
        slot.setter = (value) => { slot.value = typeof value === 'function' ? value(slot.value) : value; };
        slots[index] = slot;
      }
      return [slots[index].value, slots[index].setter];
    },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index]; },
    useEffect(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
      }
    }
  };
  const { default: hook } = await load(depsFile, {
    react,
    'utils/axios': { get(url, config) { calls.push({ url, ...config }); return responder(url, config); } }
  });
  const setFieldValue = (...args) => updates.push(args);
  return {
    calls, updates,
    render(warehouse, items) {
      cursor = 0;
      const result = hook(warehouse, items, setFieldValue);
      effects.splice(0).forEach((effect) => effect());
      return result;
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); }
  };
}

test('GI edits to qty/SMU/remark issue no new requests; duplicate items share dependencies', async () => {
  const f = await goodsFixture();
  const items = [{ barang_id: 5 }, { barang_id: 5 }, { barang_id: 8 }];
  f.render(2, items);
  await flush();
  assert.equal(f.calls.length, 4, 'two endpoints for each unique barang');
  const result = f.render(2, items.map((item) => ({ ...item, qty_pakai: 99, smu: 10, remark: 'updated' })));
  await flush();
  assert.equal(f.calls.length, 4);
  assert.equal(result.priceOptions[0][0].id, 1);
  assert.equal(result.loadingDeps[0], false);
  f.unmount();
});

test('GI preserves saved price/rack and fetches new options when the warehouse changes', async () => {
  const f = await goodsFixture();
  const items = [{ barang_id: 5, hargabeli_id: 77, rack_id: 88 }];
  f.render(2, items);
  await flush();
  assert.equal(f.updates.length, 0);
  const result = f.render(3, items);
  assert.equal(result.loadingDeps[0], true);
  await flush();
  assert.equal(f.calls.length, 4);
  assert.ok(f.calls[2].url.includes('gudang_id=3'));
  assert.equal(f.updates.length, 0);
  f.unmount();
});

test('late GI responses cannot populate a newly selected item or update an unmounted form', async () => {
  const responses = [];
  const f = await goodsFixture(() => { const response = deferred(); responses.push(response); return response.promise; });
  f.render(2, [{ barang_id: 5 }]);
  f.render(2, [{ barang_id: 8 }]);
  responses.slice(0, 2).forEach((response) => response.resolve({ data: { data: [{ id: 50 }] } }));
  await flush();
  assert.equal(f.updates.length, 0);
  f.unmount();
  assert.ok(f.calls.every((call) => call.signal.aborted));
  responses.slice(2).forEach((response) => response.resolve({ data: { data: [{ id: 80 }] } }));
  await flush();
  assert.equal(f.updates.length, 0);
});
