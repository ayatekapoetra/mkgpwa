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
  const swrCalls = [];
  const swrStateHolder = { current: options.swrState ?? null };

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
  const vmModule = new SourceTextModule(source, { context, identifier: SOURCE_URL.href });

  await vmModule.link((specifier) => {
    if (specifier === 'swr') {
      return new SyntheticModule(['default', 'mutate'], function () {
        this.setExport('default', (key, _fetcher, opts) => {
          swrCalls.push({ key, opts });
          if (swrStateHolder.current) {
            const state = typeof swrStateHolder.current === 'function'
              ? swrStateHolder.current(key, _fetcher, opts)
              : swrStateHolder.current;
            return state;
          }
          return {
            data: opts?.fallbackData ?? undefined,
            isLoading: !opts?.fallbackData,
            error: undefined,
            isValidating: false
          };
        });
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

  await vmModule.evaluate();

  const rerender = () => {
    hookState.index = 0;
    hookState.effects = [];
    return vmModule.namespace.useGetMenu();
  };

  const renderHook = async () => {
    hookState.index = 0;
    hookState.effects = [];
    vmModule.namespace.useGetMenu();
    // Run collected effects
    for (const ef of [...hookState.effects]) {
      await ef.fn();
    }
    // Allow any async IIFEs in effects to settle
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Re-render to pick up state updates
    hookState.index = 0;
    hookState.effects = [];
    return vmModule.namespace.useGetMenu();
  };

  return {
    api: vmModule.namespace,
    cleared,
    removed,
    mutated,
    swrCalls,
    swrStateHolder,
    sessionHolder,
    idbStore,
    renderHook,
    rerender
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

test('AC-F2 / Hydration: no react-device-detect in src/ to eliminate React invariant 425 & 422', async () => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next') {
          files.push(...(await scanDir(full)));
        }
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        files.push(full);
      }
    }
    return files;
  }

  const srcDir = path.resolve(import.meta.dirname, '../../');
  const allFiles = await scanDir(srcDir);
  const offending = [];

  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf8');
    if (content.includes("from 'react-device-detect'") || content.includes('from "react-device-detect"')) {
      offending.push(path.relative(srcDir, file));
    }
  }

  assert.deepEqual(offending, [], 'react-device-detect causes SSR hydration mismatch and must not be used in src/');
});

test('AC-F1 / Cache-miss fresh login: triggers SWR fetch on authenticated session and renders menu when SWR resolves', async () => {
  const idb = new Map();
  let capturedFetcher = null;

  const harness = await loadMenuModule({
    idb,
    session: {
      data: { id: 1, token: { id: 1, accessToken: 'jwt-fresh-login-token' } },
      status: 'authenticated'
    },
    swrState: (key, fn, opts) => {
      capturedFetcher = fn;
      return {
        data: undefined,
        isLoading: Boolean(key),
        error: undefined,
        isValidating: Boolean(key)
      };
    }
  });

  // 1. After IndexedDB cache-miss hydration, SWR key is active and menuLoading is true
  const stateMiss = await harness.renderHook();
  assert.equal(stateMiss.menuLoading, true);
  assert.equal(stateMiss.menuFromCache, false);
  const lastSwr = harness.swrCalls.at(-1);
  assert.equal(lastSwr?.key, '/menu/user-menu');
  assert.equal(lastSwr?.opts?.revalidateIfStale, true);
  assert.equal(lastSwr?.opts?.revalidateOnMount, true);
  assert.equal(typeof capturedFetcher, 'function');

  // 2. When SWR resolves with fresh network menu data, menuLoading becomes false and menu is populated
  harness.swrStateHolder.current = () => ({
    data: {
      dashboard: {
        id: 'group-dashboard',
        title: 'dashboard',
        type: 'group',
        children: [
          { id: 'home', title: 'Home', type: 'item', url: '/home', icon: 'home' },
          { id: 'scm', title: 'Purchasing', type: 'collapse', icon: 'box', children: [] }
        ]
      }
    },
    isLoading: false,
    error: undefined,
    isValidating: false
  });

  const stateLoaded = harness.rerender();
  assert.equal(stateLoaded.menuLoading, false);
  assert.equal(stateLoaded.menu?.children?.length, 2);
  assert.equal(stateLoaded.menu?.children?.[1]?.title, 'Purchasing');
});

test('AC-F1 / Cache-miss fresh login: menuLoading stays true when data is undefined even if isLoading is false', async () => {
  const idb = new Map();

  const harness = await loadMenuModule({
    idb,
    session: {
      data: { id: 1, token: { id: 1 } },
      status: 'authenticated'
    },
    swrState: () => ({
      data: undefined,
      isLoading: false, // Simulates delay before SWR internal isLoading toggles true
      error: undefined,
      isValidating: false
    })
  });

  const state = await harness.renderHook();
  assert.equal(state.menuLoading, true, 'menuLoading must not be false before data arrives');
  assert.equal(state.menu, undefined);
});

test('AC-F1 / Defensive fallback: MenuFromAPI returns loadingMenu with valid id when menu is falsy or missing id', async () => {
  const dashboardSourceUrl = new URL('../../menu-items/dashboard.js', import.meta.url);
  const rawSource = await readFile(dashboardSourceUrl, 'utf8');
  const cleanedSource = rawSource
    .replace(/<FormattedMessage\s+id="dashboard"\s*\/>/g, '"dashboard"')
    .replace(/<FormattedMessage\s+id=\{title\}\s*\/>/g, 'title');
  const context = createContext({ console });
  const vmModule = new SourceTextModule(cleanedSource, { context });
  await vmModule.link((specifier) => {
    if (specifier === 'react-intl') {
      return new SyntheticModule(['FormattedMessage'], function () {
        this.setExport('FormattedMessage', (props) => props.id);
      }, { context });
    }
    if (specifier === 'iconsax-react') {
      const iconNames = [
        'Android', 'Windows', 'Home3', 'Home2', 'HomeTrendUp', 'Box1', 'Bank',
        'Book1', 'I24Support', 'MessageProgramming', 'Truck', 'Box', 'Airdrop',
        'VoiceCricle', 'CardCoin', 'TruckFast', 'TruckTime', 'Ship', 'OceanProtocol',
        'Radar2', 'SmartCar', 'TaskSquare', 'CpuSetting', 'SecurityUser', 'Logout',
        'Scanner', 'TruckTick', 'Book', 'FavoriteChart', 'PresentionChart', 'Location',
        'Task', 'Profile2User', 'Buildings', 'Diagram', 'Layer', 'ReceiptItem',
        'NoteText', 'ClipboardText', 'ShieldTick', 'DocumentText', 'FingerScan', 'Health'
      ];
      return new SyntheticModule(iconNames, function () {
        for (const name of iconNames) {
          this.setExport(name, () => null);
        }
      }, { context });
    }
    if (specifier === 'utils/getMenuIcon') {
      return new SyntheticModule(['getMenuIcon'], function () {
        this.setExport('getMenuIcon', () => () => null);
      }, { context });
    }
    throw new Error(`Unmocked specifier: ${specifier}`);
  });
  await vmModule.evaluate();
  const { MenuFromAPI } = vmModule.namespace;

  // Case 1: menu is undefined and menuLoading is false (the bug path)
  const menuUndef = MenuFromAPI({ menu: undefined, menuLoading: false, messages: {} });
  assert.ok(menuUndef?.id, 'Returned menu must have an id so items is not empty []');
  assert.equal(menuUndef.id, 'group-dashboard-loading');

  // Case 2: menu has no id
  const menuNoId = MenuFromAPI({ menu: { children: [] }, menuLoading: false, messages: {} });
  assert.equal(menuNoId?.id, 'group-dashboard-loading');

  // Case 3: menu is valid with id
  const validMenu = MenuFromAPI({
    menu: {
      id: 'group-dashboard',
      title: 'dashboard',
      type: 'group',
      children: [{ id: 'home', title: 'Home', type: 'item', url: '/home' }]
    },
    menuLoading: false,
    messages: {}
  });
  assert.equal(validMenu?.id, 'group-dashboard');
  assert.equal(validMenu?.children?.length, 1);
});
