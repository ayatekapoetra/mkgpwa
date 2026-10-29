const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transform } = require('next/dist/build/swc');

// Component/request boundary tests with synthetic API rows; not live E2E evidence.
async function compile(file) {
  return (await transform(fs.readFileSync(file, 'utf8'), {
    filename: file,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'classic' } } },
    module: { type: 'commonjs' }
  })).code;
}
function renderer(store, code, hookCode, requestLog) {
  const slots = [];
  let cursor = 0;
  const effects = [];
  const React = {
    createElement(type, props, ...children) { return { type, props: { ...props, children } }; },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useCallback(fn) { return fn; },
    useMemo(fn) { return fn(); },
    useEffect(fn) { effects.push(fn); }
  };
  const sessionStorage = { getItem: (k) => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  function load(source, imports) {
    const module = { exports: {} };
    vm.runInNewContext(source, { module, exports: module.exports, React, console, window: { sessionStorage }, require: (name) => imports(name) });
    return module.exports;
  }
  const hook = load(hookCode, () => React);
  const page = load(code, (name) => {
    if (name === 'react') return React;
    if (name === 'hooks/useFilterStorage') return hook;
    if (name === 'api/purchasing-request') return {
      usePurchasingRequestAccess: () => ({ permissions: { can_read: true, can_insert: true } }),
      useGetPurchasingRequests: (params, enabled) => {
        requestLog.push({ ...params, enabled });
        return { rows: [{ id: 'synthetic-pr', status: params.status || 'draft', kode: params.kode }], page: params.page, perPage: params.limit, total: 1, lastPage: 1 };
      }
    };
    if (name === 'config') return { APP_DEFAULT_PATH: '/' };
    if (name === './filter') return { default: 'PRFilter', __esModule: true };
    if (name === './list') return { default: 'PRList', __esModule: true };
    return new Proxy({ __esModule: true, default: name }, { get: (o, k) => o[k] || String(k) });
  });
  return () => { cursor = 0; const tree = page.default(); effects.splice(0).forEach((fn) => fn()); return tree; };
}
function find(tree, type) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === type) return tree;
  for (const child of (tree.props?.children || []).flat(Infinity)) { const result = find(child, type); if (result) return result; }
  return null;
}

test('PR applied filter survives detail/back/menu/reload and reaches request + list without default overwrite; Reset removes key', async () => {
  const code = await compile(process.env.PR_PAGE_FILE || 'src/views/scm/purchasing-request/index.js');
  const hook = await compile(process.env.FILTER_HOOK_FILE || 'src/hooks/useFilterStorage.js');
  const store = new Map();
  const requests = [];
  let render = renderer(store, code, hook, requests);
  let tree = render();
  find(tree, 'PRFilter').props.onApply({ kode: 'SYNTH-PR-09', status: 'approved', date_start: '2026-10-01', bisnis_id: 'test-bu' });
  tree = render();
  assert.equal(requests.at(-1).kode, 'SYNTH-PR-09');
  assert.equal(find(tree, 'PRList').props.rows[0].kode, 'SYNTH-PR-09');
  find(tree, 'components/Paginate').props.onPageChange(4);
  render();
  const key = 'mkg_filter_scm_purchasing_request';
  assert.equal(JSON.parse(store.get(key)).page, undefined);
  for (const navigation of ['detail/back', 'menu', 'reload']) {
    render = renderer(store, code, hook, requests);
    tree = render();
    assert.equal(find(tree, 'PRFilter').props.params.kode, 'SYNTH-PR-09', navigation);
    assert.equal(requests.at(-1).status, 'approved', navigation);
    assert.equal(requests.at(-1).page, 1, navigation);
    assert.equal(find(tree, 'PRList').props.rows[0].kode, 'SYNTH-PR-09');
  }
  find(tree, 'PRFilter').props.onReset();
  render();
  assert.equal(store.has(key), false);
  assert.equal(requests.at(-1).kode, '');
  render = renderer(store, code, hook, requests);
  assert.equal(find(render(), 'PRFilter').props.params.kode, '');
  const newTab = renderer(new Map(), code, hook, requests);
  assert.equal(find(newTab(), 'PRFilter').props.params.status, '');
});
