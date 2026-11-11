import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const SOURCE_URL = new URL('../menu.js', import.meta.url);

const loadMenuModule = async (options = {}) => {
  const source = await readFile(SOURCE_URL, 'utf8');
  const cleared = [];
  const removed = [];
  const mutated = [];

  const sessionHolder = {
    current: options.session ?? { data: null, status: 'unauthenticated' }
  };
  const idbStore = options.idb ?? new Map();

  const hookState = {
    slots: [],
    index: 0,
    effects: []
  };

  const context = createContext({
    console,
    window: {
      sessionStorage: {
        _data: new Map(),
        getItem(k) { return this._data.get(k) || null; },
        setItem(k, v) { this._data.set(k, String(v)); },
        removeItem(k) { this._data.delete(k); }
      },
      localStorage: {
        _data: new Map(),
        getItem(k) { return this._data.get(k) || null; },
        setItem(k, v) { this._data.set(k, String(v)); },
        removeItem(k) { this._data.delete(k); }
      }
    }
  });
  const module = new SourceTextModule(source, { context, identifier: SOURCE_URL.href });

  await module.link((specifier) => {
    if (specifier === 'swr') {
      return new SyntheticModule(['default', 'mutate'], function () {
        this.setExport('default', (key, _fetcher, opts) => ({
          data: opts?.fallbackData ?? undefined,
          isLoading: !opts?.fallbackData,
          error: undefined,
          isValidating: false
        }));
        this.setExport('mutate', async (key, data, opts) => {
          mutated.push({ key, data, opts });
        });
      }, { context });
    }

    if (specifier === 'react') {
      return new SyntheticModule(
        ['useEffect', 'useMemo', 'useState'],
        function () {
          this.setExport('useEffect', (fn, deps) => {
            hookState.effects.push({ fn, deps });
          });
          this.setExport('useMemo', (factory) => factory());
          this.setExport('useState', (initial) => {
            const idx = hookState.index++;
            if (hookState.slots.length <= idx) {
              hookState.slots.push(typeof initial === 'function' ? initial() : initial);
            }
            const setState = (next) => {
              hookState.slots[idx] = typeof next === 'function' ? next(hookState.slots[idx]) : next;
            };
            return [hookState.slots[idx], setState];
          });
        },
        { context }
      );
    }

    if (specifier === 'next-auth/react') {
      return new SyntheticModule(['useSession'], function () {
        this.setExport('useSession', () => sessionHolder.current);
      }, { context });
    }

    if (specifier === 'utils/axios') {
      return new SyntheticModule(['fetcher'], function () {
        this.setExport('fetcher', async () => ({}));
      }, { context });
    }

    if (specifier === 'lib/useOfflineStorage') {
      return new SyntheticModule(
        [
          'useOfflineStorage',
          'getOfflineData',
          'removeOfflineData',
          'clearOfflineDataByPrefix'
        ],
        function () {
          this.setExport('useOfflineStorage', () => {});
          this.setExport('getOfflineData', async (store, key) => {
            return idbStore.get(key) ?? null;
          });
          this.setExport('removeOfflineData', async (store, key) => {
            removed.push({ store, key });
            idbStore.delete(key);
          });
          this.setExport('clearOfflineDataByPrefix', async (store, prefix) => {
            cleared.push({ store, prefix });
            for (const k of idbStore.keys()) {
              if (k.startsWith(prefix)) idbStore.delete(k);
            }
          });
        },
        { context }
      );
    }

    if (specifier === 'utils/getMenuIcon') {
      return new SyntheticModule(['getMenuIcon'], function () {
        this.setExport('getMenuIcon', (name) => `icon:${name}`);
      }, { context });
    }

    assert.fail(`Unexpected import: ${specifier}`);
  });

  await module.evaluate();

  const renderHook = async () => {
    hookState.index = 0;
    hookState.effects = [];
    module.namespace.useGetMenu();
    // Run collected effects
    for (const ef of [...hookState.effects]) {
      await ef.fn();
    }
    // Allow any async IIFEs in effects to settle
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Re-render to pick up state updates
    hookState.index = 0;
    hookState.effects = [];
    return module.namespace.useGetMenu();
  };

  return {
    api: module.namespace,
    cleared,
    removed,
    mutated,
    sessionHolder,
    idbStore,
    renderHook
  };
};

test('getUserMenuCacheKey is per-user and rejects empty ids', async () => {
  const { api } = await loadMenuModule();
  assert.equal(api.getUserMenuCacheKey(12), 'user-menu-12');
  assert.equal(api.getUserMenuCacheKey('abc'), 'user-menu-abc');
  assert.equal(api.getUserMenuCacheKey(null), null);
  assert.equal(api.getUserMenuCacheKey(''), null);
  assert.equal(api.LAST_USER_MENU_KEY, 'mkg_last_user_menu_key');
});

test('HOME_ONLY_MENU matches BE unauthenticated fallback shape', async () => {
  const { api } = await loadMenuModule();
  assert.equal(api.HOME_ONLY_MENU.dashboard.children[0].title, 'Home');
  assert.equal(api.HOME_ONLY_MENU.dashboard.children[0].url, '/home');
});

test('clearUserMenuCaches clears prefix keys, legacy key, and SWR cache', async () => {
  const { api, cleared, removed, mutated } = await loadMenuModule();
  await api.clearUserMenuCaches();
  assert.deepEqual(cleared, [{ store: 'menu', prefix: 'user-menu-' }]);
  assert.deepEqual(removed, [{ store: 'menu', key: 'user-menu' }]);
  assert.equal(mutated.length, 1);
  assert.equal(mutated[0].key, '/menu/user-menu');
  assert.equal(mutated[0].data, undefined);
  // Compare fields (VM context objects are not reference-equal across realms).
  assert.equal(mutated[0].opts?.revalidate, false);
});

test('all hardcoded menu injections are removed (Tahap B)', async () => {
  const source = await readFile(SOURCE_URL, 'utf8');
  for (const title of [
    'Crew Work Activity',
    'Harga Beli',
    'Equipment Mobilization',
    'Event History',
    'Laporan Stockopname',
    'WA Config Equipment Breakdown',
    'Goods Issues',
    'Stockopname',
    'Akunting Mapping',
    'Rack Cycle Time'
  ]) {
    assert.equal(source.includes(title), false, `expected injection removed: ${title}`);
  }
  assert.equal(source.includes('applyPendingBackendInjections'), false);
  assert.equal(source.includes('/akunting-mapping'), false);
  assert.equal(source.includes('/warehouse/racks'), false);
  assert.match(source, /revalidateIfStale:\s*false/);
  assert.match(source, /revalidateOnFocus:\s*false/);
  assert.match(source, /revalidateOnReconnect:\s*false/);
});

test('AC-05: login A -> tanpa logout -> login B: sidebar B tidak memuat satu pun judul milik A', async () => {
  const idb = new Map();
  idb.set('user-menu-userA', {
    dashboard: {
      id: 'group-dashboard-a',
      title: 'dashboard',
      children: [
        { id: 'secret-a', title: 'Menu Rahasia User A', url: '/rahasia-a', icon: 'lock' }
      ]
    }
  });
  idb.set('user-menu-userB', {
    dashboard: {
      id: 'group-dashboard-b',
      title: 'dashboard',
      children: [
        { id: 'public-b', title: 'Menu Khusus User B', url: '/khusus-b', icon: 'user' }
      ]
    }
  });

  const harness = await loadMenuModule({
    idb,
    session: { data: { id: 'userA' }, status: 'authenticated' }
  });

  // 1. User A renders and sees User A's menu
  const menuA = await harness.renderHook();
  assert.equal(menuA.menuLoading, false);
  assert.equal(menuA.menu?.children?.[0]?.title, 'Menu Rahasia User A');

  // 2. Switch to User B WITHOUT logout (no clearUserMenuCaches call)
  harness.sessionHolder.current = { data: { id: 'userB' }, status: 'authenticated' };
  const menuB = await harness.renderHook();

  // 3. User B MUST NOT have any title belonging to User A
  const serializedB = JSON.stringify(menuB.menu);
  assert.equal(serializedB.includes('Menu Rahasia User A'), false, 'Sidebar B must not contain any title of User A');
  assert.equal(menuB.menu?.children?.[0]?.title, 'Menu Khusus User B');

  // 4. Switch to User C with NO cache in IndexedDB (cache miss)
  harness.sessionHolder.current = { data: { id: 'userC' }, status: 'authenticated' };
  const menuC = await harness.renderHook();
  const serializedC = JSON.stringify(menuC.menu) || '';
  assert.equal(serializedC.includes('Menu Rahasia User A'), false, 'User C must not see User A titles');
  assert.equal(serializedC.includes('Menu Khusus User B'), false, 'User C must not see User B titles');
  assert.equal(menuC.menu, undefined, 'User C with empty cache must not render stale cache');
  assert.equal(menuC.hasOfflineCache ?? false, false);
});

test('AC-05: session loading: cache tidak me-render menu sebelum userId terverifikasi', async () => {
  const idb = new Map();
  idb.set('user-menu-userA', {
    dashboard: {
      id: 'group-dashboard-a',
      title: 'dashboard',
      children: [
        { id: 'secret-a', title: 'Menu Rahasia User A', url: '/rahasia-a', icon: 'lock' }
      ]
    }
  });

  const harness = await loadMenuModule({
    idb,
    session: { data: null, status: 'loading' }
  });

  // While session is loading, menu must be undefined/null and loading is true
  const menuLoading = await harness.renderHook();
  assert.equal(menuLoading.menu, undefined);
  assert.equal(menuLoading.menuLoading, true);
  assert.equal(menuLoading.menuFromCache, false);
});
