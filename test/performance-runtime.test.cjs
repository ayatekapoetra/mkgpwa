const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const axios = require('axios');
const { transform } = require('next/dist/build/swc');

const files = ['src/utils/axios.js', 'src/lib/legacy-pwa-cleanup.js', 'src/lib/offlineFetchBrowser.js', 'src/hooks/useDebouncedValue.js'];
const compiled = Promise.all(files.map(async (file) => [file, (await transform(
  fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
  { filename: file, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } }
)).code])).then(Object.fromEntries);

async function load(file, deps, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext((await compiled)[file], {
    module, exports: module.exports, console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, URLSearchParams, process: { env: {} }, ...globals,
    require(name) { if (name in deps) return deps[name]; throw new Error(`Unexpected dependency: ${name}`); }
  });
  return module.exports;
}

async function clientFixture(online = true) {
  let queued = 0;
  const { default: client } = await load(files[0], {
    axios,
    './session-cache': { getCachedSession: async () => ({ token: { accessToken: 'current' } }), updateCachedSession() {} },
    'lib/offlineFetch': { saveRequest: async () => { queued++; } }
  }, { window: { location: { hostname: 'test', pathname: '/home', href: 'http://test/home' } }, navigator: { onLine: online } });
  return { client, get queued() { return queued; } };
}

test('API reads use an interactive timeout and do not retry timeouts by default', async () => {
  const f = await clientFixture();
  let attempts = 0;
  f.client.defaults.adapter = async (config) => {
    attempts++;
    assert.equal(config.timeout, 30000);
    assert.equal(config.headers.Authorization, 'Bearer current');
    throw new axios.AxiosError('timeout', 'ECONNABORTED', config);
  };
  await assert.rejects(f.client.get('/master/items'), /timeout/);
  assert.equal(attempts, 1);
});

test('failed mutations are not automatically repeated and retain the longer timeout', async () => {
  const f = await clientFixture();
  let attempts = 0;
  f.client.defaults.adapter = async (config) => {
    attempts++;
    assert.equal(config.timeout, 60000);
    throw new axios.AxiosError('failed', 'ERR_BAD_RESPONSE', config, null, { status: 500, data: { message: 'backend failed' } });
  };
  await assert.rejects(f.client.post('/scm/purchase-orders/7/verify', {}), (error) => error.message === 'backend failed');
  assert.equal(attempts, 1);
});

test('transient GET failures may retry once and export retains its dedicated timeout', async () => {
  const f = await clientFixture();
  let attempts = 0;
  f.client.defaults.adapter = async (config) => {
    assert.equal(config.timeout, 300000);
    if (++attempts === 1) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
    return { status: 200, data: 'export', headers: {}, config };
  };
  assert.equal((await f.client.get('/report/export-excel', { retryDelay: 0 })).data, 'export');
  assert.equal(attempts, 2);
});

test('cancelled requests are never retried or added to the offline queue', async () => {
  const f = await clientFixture(false);
  const controller = new AbortController();
  controller.abort();
  let attempts = 0;
  f.client.defaults.adapter = async () => { attempts++; throw new Error('must not execute'); };
  await assert.rejects(f.client.get('/search', { signal: controller.signal }), (error) => axios.isCancel(error));
  assert.equal(attempts, 0);
  assert.equal(f.queued, 0);
});

test('legacy cleanup is single-flight and preserves application caches, preferences and IndexedDB', async () => {
  let registrationsRead = 0;
  let unregisters = 0;
  const deletedCaches = [];
  const local = new Map([['workbox-old', 'x'], ['timesheet_filter_params', 'keep'], ['theme-config', 'keep']]);
  const session = new Map();
  const cache = { keys: async () => ['workbox-old', 'app-cache-store'], delete: async (name) => { deletedCaches.push(name); } };
  const globals = {
    window: { caches: cache },
    navigator: { serviceWorker: { getRegistrations: async () => { registrationsRead++; return [{ unregister: async () => { unregisters++; } }]; } } },
    localStorage: { get length() { return local.size; }, key: (i) => [...local.keys()][i], removeItem: (key) => local.delete(key) },
    sessionStorage: { getItem: (key) => session.get(key), setItem: (key, value) => session.set(key, value) },
    indexedDB: { deleteDatabase: () => assert.fail('must not delete IndexedDB') }
  };
  const api = await load(files[1], {}, globals);
  await Promise.all([api.cleanupLegacyPwa(), api.cleanupLegacyPwa(), api.cleanupLegacyPwa()]);
  assert.equal(registrationsRead, 1);
  assert.equal(unregisters, 1);
  assert.deepEqual(deletedCaches, ['workbox-old']);
  assert.equal(local.has('workbox-old'), false);
  assert.equal(local.get('timesheet_filter_params'), 'keep');
  const remounted = await load(files[1], {}, globals);
  await remounted.cleanupLegacyPwa();
  assert.equal(registrationsRead, 1, 'tab migration marker survives module remount');
});

test('offline replay emits one storage update for a batch and reports final progress', async () => {
  const queue = new Map(Array.from({ length: 10 }, (_, i) => [String(i), { timestamp: i, url: `/items/${i}`, method: 'POST' }]));
  const events = [];
  const progress = [];
  const { replayRequests } = await load(files[2], {
    localforage: { createInstance: () => ({
      iterate: async (callback) => queue.forEach((value, key) => callback(value, key)),
      removeItem: async (key) => queue.delete(key)
    }) },
    axios,
    'utils/axios': async () => ({ status: 200 })
  }, { window: { location: { hostname: 'test' }, dispatchEvent: (event) => events.push(event) }, navigator: { onLine: true }, Event });
  const result = await replayRequests((value) => progress.push(value));
  assert.equal(result.synced, 10);
  assert.equal(queue.size, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'queue-updated');
  assert.equal(progress.at(-1).synced, 10);
});

test('debounce cancels intermediate searches and publishes only the final input', async () => {
  let value;
  let previous;
  let cleanup;
  let counter = 0;
  const timers = new Map();
  const { default: useDebouncedValue } = await load(files[3], {
    react: {
      useState(initial) { if (value === undefined) value = initial; return [value, (next) => { value = next; }]; },
      useEffect(callback, deps) {
        if (!previous || deps.some((item, i) => item !== previous[i])) { cleanup?.(); previous = deps; cleanup = callback(); }
      }
    }
  }, { setTimeout: (callback) => { timers.set(++counter, callback); return counter; }, clearTimeout: (id) => timers.delete(id) });
  useDebouncedValue('');
  useDebouncedValue('1');
  useDebouncedValue('12');
  useDebouncedValue('123');
  assert.equal(value, '');
  assert.equal(timers.size, 1);
  [...timers.values()][0]();
  assert.equal(value, '123');
});
