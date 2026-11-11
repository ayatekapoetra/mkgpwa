import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const SOURCE_URL = new URL('../menu.js', import.meta.url);

const loadMenuModule = async () => {
  const source = await readFile(SOURCE_URL, 'utf8');
  const cleared = [];
  const removed = [];
  const mutated = [];

  const context = createContext({ console });
  const module = new SourceTextModule(source, { context, identifier: SOURCE_URL.href });

  await module.link((specifier) => {
    if (specifier === 'swr') {
      return new SyntheticModule(['default', 'mutate'], function () {
        this.setExport('default', () => ({
          data: undefined,
          isLoading: false,
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
          this.setExport('useEffect', () => {});
          this.setExport('useMemo', (factory) => factory());
          this.setExport('useState', (initial) => [initial, () => {}]);
        },
        { context }
      );
    }

    if (specifier === 'next-auth/react') {
      return new SyntheticModule(['useSession'], function () {
        this.setExport('useSession', () => ({
          data: null,
          status: 'unauthenticated'
        }));
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
          this.setExport('getOfflineData', async () => null);
          this.setExport('removeOfflineData', async (store, key) => {
            removed.push({ store, key });
          });
          this.setExport('clearOfflineDataByPrefix', async (store, prefix) => {
            cleared.push({ store, prefix });
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
  return { api: module.namespace, cleared, removed, mutated };
};

test('getUserMenuCacheKey is per-user and rejects empty ids', async () => {
  const { api } = await loadMenuModule();
  assert.equal(api.getUserMenuCacheKey(12), 'user-menu-12');
  assert.equal(api.getUserMenuCacheKey('abc'), 'user-menu-abc');
  assert.equal(api.getUserMenuCacheKey(null), null);
  assert.equal(api.getUserMenuCacheKey(''), null);
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
