import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const flush = () => new Promise((resolve) => setImmediate(resolve));

// Load the real hook and cache helpers with a storage driver that rejects
// overlapping access, as IndexedDB can do during object-store upgrades.
async function fixture({ browser = true } = {}) {
  const instances = [];
  const errors = [];
  const effects = [];
  let previousDeps;
  let active = 0;
  let maxActive = 0;
  let failure = null;
  const context = createContext({
    ...(browser ? { window: {} } : {}),
    console: { error: (...args) => errors.push(args) }
  });
  const localforage = {
    createInstance(config) {
      const data = new Map();
      const operate = async (callback) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        try {
          if (active > 1) throw new TypeError("Cannot read properties of null (reading 'db')");
          await flush();
          if (failure) throw failure;
          return callback();
        } finally {
          active -= 1;
        }
      };
      const store = {
        config,
        data,
        getItem: (key) => operate(() => data.get(key) ?? null),
        setItem: (key, value) => operate(() => { data.set(key, value); return value; })
      };
      instances.push(store);
      return store;
    }
  };
  const storage = new SourceTextModule(await readFile(new URL('../../utils/localStorage.js', import.meta.url), 'utf8'), { context });
  await storage.link((specifier) => {
    assert.equal(specifier, 'localforage');
    return new SyntheticModule(['default'], function () { this.setExport('default', localforage); }, { context });
  });
  await storage.evaluate();

  const hook = new SourceTextModule(await readFile(new URL('../useOfflineStorage.js', import.meta.url), 'utf8'), { context });
  await hook.link((specifier) => {
    if (specifier === 'utils/localStorage') return storage;
    assert.equal(specifier, 'react');
    return new SyntheticModule(['useEffect'], function () {
      this.setExport('useEffect', (callback, deps) => {
        if (!previousDeps || deps.some((value, i) => !Object.is(value, previousDeps[i]))) {
          effects.push(callback);
          previousDeps = deps;
        }
      });
    }, { context });
  });
  await hook.evaluate();

  return {
    cache: storage.namespace,
    hook: hook.namespace,
    instances,
    errors,
    effects,
    get maxActive() { return maxActive; },
    set failure(value) { failure = value; },
    runEffects() { effects.splice(0).forEach((effect) => effect()); }
  };
}

test('rerenders reuse the store and do not resave unchanged API data', async () => {
  const f = await fixture();
  const data = { rows: [{ id: 1 }] };
  f.hook.useOfflineStorage('menu', 'user-menu', data);
  assert.equal(f.instances.length, 0, 'render must not create a storage instance');
  f.runEffects();
  assert.equal(f.instances.length, 1);
  f.hook.useOfflineStorage('menu', 'user-menu', data);
  assert.equal(f.effects.length, 0);
  assert.strictEqual(await f.hook.getOfflineData('menu', 'user-menu'), data);
  assert.equal(f.instances.length, 1);
  assert.equal(f.instances[0].config.name, 'master-data');
});

test('different master-data stores serialize concurrent initialization, writes and reads', async () => {
  const f = await fixture();
  const menu = f.cache.createLocalStore('menu');
  const cabang = f.cache.createLocalStore('cabang');
  await Promise.all([
    f.cache.setCachedData(menu, 'user-menu', { id: 1 }),
    f.cache.setCachedData(cabang, 'cabang', { id: 2 }),
    f.cache.setCachedData(menu, 'user-access', { id: 3 })
  ]);
  const values = await Promise.all([
    f.cache.getCachedData(menu, 'user-menu'),
    f.cache.getCachedData(cabang, 'cabang'),
    f.hook.getOfflineData('menu', 'user-access')
  ]);
  assert.deepEqual(values, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.equal(f.maxActive, 1);
  assert.equal(f.instances.length, 2);
  assert.equal(f.errors.length, 0);
});

test('failed background cache writes are handled and do not block later operations', async () => {
  const f = await fixture();
  f.failure = new TypeError("Cannot read properties of null (reading 'db')");
  f.hook.useOfflineStorage('menu', 'user-menu', { rows: [] });
  f.runEffects();
  assert.equal(await f.hook.getOfflineData('menu', 'user-menu'), null);
  assert.equal(f.errors.length, 2, 'both write and read failures must be handled');

  f.failure = null;
  const updated = { rows: [{ id: 9 }] };
  f.hook.useOfflineStorage('menu', 'user-menu', updated);
  f.runEffects();
  assert.strictEqual(await f.hook.getOfflineData('menu', 'user-menu'), updated);
});

test('server-side cache access skips browser storage', async () => {
  const f = await fixture({ browser: false });
  assert.equal(await f.hook.getOfflineData('menu', 'user-menu'), null);
  assert.equal(f.instances.length, 0);
  const store = f.cache.createLocalStore('menu');
  await f.cache.setCachedData(store, 'user-menu', { rows: [] });
  assert.equal(await f.cache.getCachedData(store, 'user-menu'), null);
  assert.equal(f.maxActive, 0);
});

test('a changed store name or key persists to the correct store', async () => {
  const f = await fixture();
  const data = { rows: [] };
  for (const [storeName, key] of [['menu', 'user-menu'], ['menu', 'user-access'], ['cabang', 'cabang']]) {
    f.hook.useOfflineStorage(storeName, key, data);
    assert.equal(f.effects.length, 1);
    f.runEffects();
    assert.strictEqual(await f.hook.getOfflineData(storeName, key), data);
  }
  assert.equal(f.instances.length, 2);
});
