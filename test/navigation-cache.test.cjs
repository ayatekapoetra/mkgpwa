const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const files = ['middleware.js', 'src/middleware.js', 'src/views/scm/purchasing-orders/list.js'];
const compiled = Promise.all(files.map(async (file) => [file, (await transform(
  fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
  { filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' }, module: { type: 'commonjs' } }
)).code])).then(Object.fromEntries);

async function load(file, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext((await compiled)[file], {
    module, exports: module.exports, React, URL, process: { env: {} }, console,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    }
  });
  return module.exports;
}

for (const file of files.slice(0, 2)) {
  test(`${file}: navigation preserves storage and authentication redirects`, async () => {
    let token = null;
    const api = await load(file, {
      'next/server': { NextResponse: {
        next: () => ({ headers: new Headers() }),
        redirect: (url) => ({ location: url.href })
      } },
      'next-auth/jwt': { getToken: async () => token }
    });
    const request = (pathname) => ({ nextUrl: new URL(`http://localhost:3005${pathname}`), url: `http://localhost:3005${pathname}` });
    const publicPage = await api.middleware(request('/login'));
    assert.equal(publicPage.headers.has('Clear-Site-Data'), false);
    assert.match(publicPage.headers.get('Cache-Control'), /private/);
    assert.equal((await api.middleware(request('/purchasing-orders'))).location, 'http://localhost:3005/login');
    token = { usertype: 'developer' };
    const protectedPage = await api.middleware(request('/purchasing-orders'));
    assert.equal(protectedPage.headers.has('Clear-Site-Data'), false);
    token = { authPortal: 'customers' };
    assert.equal((await api.middleware(request('/purchasing-orders'))).location, 'http://localhost:3005/customers');
  });
}

function walk(node) {
  if (!React.isValidElement(node)) return [];
  if (typeof node.type === 'function') return walk(node.type(node.props));
  return [node, ...React.Children.toArray(node.props.children).flatMap(walk)];
}

for (const mobile of [false, true]) {
  test(`PO ${mobile ? 'mobile' : 'desktop'} renders one layout with client-side detail navigation`, async () => {
    const mui = new Proxy({ useTheme: () => ({ breakpoints: { down: () => 'md' } }), useMediaQuery: () => mobile }, {
      get: (target, key) => key === '__esModule' ? false : target[key] || key
    });
    const { default: List } = await load(files[2], {
      'next/link': 'NextLink',
      '@mui/icons-material/LinkOutlined': 'LinkIcon',
      '@mui/material': mui,
      moment: require('moment'), 'moment/locale/id': {},
      './components/StatusChip': 'StatusChip',
      './utils': { formatCurrency: String }
    });
    const nodes = walk(List({ rows: [{ id: 7, kdpo: 'PO-7' }] }));
    const details = nodes.filter((node) => node.type === 'Button' && node.props.href);
    assert.equal(details.length, 1);
    assert.equal(details[0].props.component, 'NextLink');
    assert.equal(details[0].props.href, '/purchasing-orders/7');
  });
}
