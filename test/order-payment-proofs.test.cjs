const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { transform } = require('next/dist/build/swc');

const base = 'src/views/scm/order-payment/';
const paths = [base + 'payment-proofs.js', base + 'PaymentProofManager.js', base + 'detail.js', 'src/api/order-payments.js'];
const compiled = Promise.all(paths.map(async file => [file, (await transform(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
  filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } }, target: 'es2022' }, module: { type: 'commonjs' }
})).code])).then(Object.fromEntries);
const flush = () => new Promise(resolve => setImmediate(resolve));
const png = () => new File([Buffer.from('89504e470d0a1a0a00000000', 'hex')], 'proof.png', { type: 'image/png' });
const serverProof = { id: 9, bb_id: 1, url: 'https://cdn.test/upload/new.png', datatype: 'png', name: 'new.png' };
const allPermissions = { can_read: true, can_post: true, can_delete: true, can_upload_attachment: true, can_replace_attachment: true, can_remove_attachment: true };

function walk(node) {
  if (!React.isValidElement(node)) return [];
  if (node.type === 'Dialog' && !node.props.open) return [node];
  return [node, ...React.Children.toArray(node.props.children).flatMap(walk)];
}
function text(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return React.Children.toArray(node.props?.children).map(text).join('');
}

async function fixture(options = {}) {
  const source = await compiled;
  let cursor = 0;
  const slots = [];
  const effects = [];
  const calls = [];
  const notices = [];
  const storage = new Map(options.drafts ? [['order-payment-proofs:1', JSON.stringify(options.drafts)]] : []);
  let row = { id: 1, bisnis_id: 9, narasi: 'Original', trx_date: '2026-10-19', status: options.paid ? 'paid' : 'pending', items: [], payment_attachments: [{ id: 7, url: 'https://cdn.test/old.png', datatype: 'png' }] };
  const permissions = { ...allPermissions, ...options.permissions };
  const react = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
    },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index]; },
    useMemo: factory => factory(),
    useEffect(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
      }
    }
  };
  const window = { confirm: () => options.confirm !== false, addEventListener() {}, removeEventListener() {}, localStorage: {
    getItem: key => storage.get(key) || null, removeItem: key => storage.delete(key)
  } };
  const cache = {};
  let managerProps;
  const api = {
    useOrderPaymentAccess: () => ({ permissions }),
    useOrderPaymentDetail: () => ({ row, loading: false, refresh: async (update) => {
      if (typeof update === 'function') row = update({ rows: row }).rows;
    } }),
    fetchWallets: async () => [{ id: 3, coa_id: 80 }],
    postOrderPayment: async (...args) => calls.push(['post-payment', ...args]),
    removeOrderPayment: async (...args) => calls.push(['rollback', ...args]),
    uploadOrderPaymentAttachments: async (...args) => { calls.push(['upload', ...args]); return options.upload ? options.upload(...args) : [serverProof]; },
    replaceOrderPaymentAttachment: async (...args) => { calls.push(['replace', ...args]); return options.replace ? options.replace(...args) : serverProof; },
    deleteOrderPaymentAttachment: async (...args) => { calls.push(['delete', ...args]); if (options.deleteError) throw new Error('delete failed'); return { deleted: true }; }
  };
  const props = {
    paymentId: 1, attachments: row.payment_attachments, permissions, busy: false, mutationLock: { current: false },
    onBusyChange(value) { props.busy = value; },
    async onChanged(change) {
      const next = load(base + 'payment-proofs.js').applyPaymentAttachmentChange({ rows: row }, row, change);
      row = next.rows;
      props.attachments = row.payment_attachments;
    }
  };
  const axiosCalls = [];
  const axios = Object.fromEntries(['post', 'put', 'delete'].map(method => [method, async (...args) => {
    axiosCalls.push([method, ...args]);
    if (options.axiosError) throw { diagnostic: { error: 'S3 gagal' } };
    return { data: { diagnostic: { error: false }, rows: method === 'post' ? [serverProof] : serverProof } };
  }]));

  function load(file) {
    if (cache[file]) return cache[file].exports;
    const module = { exports: {} };
    cache[file] = module;
    vm.runInNewContext(source[file], {
      module, exports: module.exports, React, window, File, FormData, atob, Uint8Array, Intl,
      require(name) {
        if (name === 'react') return react;
        if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
        if (name.startsWith('@mui/icons-material/')) return () => null;
        if (name === 'iconsax-react') return new Proxy({}, { get: () => () => null });
        if (name === 'next/link') return 'a';
        if (name === 'next/navigation') return { useParams: () => ({ id: 1 }), useRouter: () => ({ push: route => calls.push(['navigate', route]) }) };
        if (name === 'api/order-payments') return api;
        if (name === 'api/notification') return { openNotification: notice => notices.push(notice) };
        if (name.startsWith('components/')) return name;
        if (name === 'config') return { APP_DEFAULT_PATH: '/home' };
        if (name === 'swr') return { __esModule: true, default: () => ({ data: { rows: { permissions } } }) };
        if (name === 'utils/axios') return { __esModule: true, default: axios };
        if (name.startsWith('.')) return load(path.posix.normalize(`${path.posix.dirname(file)}/${name}.js`));
        assert.fail(`Unexpected dependency ${name}`);
      }
    }, { filename: file });
    return module.exports;
  }
  return {
    calls, notices, storage, props, axiosCalls,
    utils: load(base + 'payment-proofs.js'), api: load('src/api/order-payments.js'),
    render(parent = false) {
      cursor = 0;
      effects.length = 0;
      const component = load(base + (parent ? 'detail.js' : 'PaymentProofManager.js')).default;
      const tree = component(parent ? {} : props);
      effects.splice(0).forEach(effect => effect());
      managerProps = walk(tree).find(node => node.type === load(base + 'PaymentProofManager.js').default)?.props;
      return walk(tree);
    },
    managerProps: () => managerProps
  };
}

test('API sends multipart data to POST/PUT and disables retry/offline queue on every mutation', async () => {
  const f = await fixture();
  const file = png();
  await f.api.uploadOrderPaymentAttachments(1, [file, file]);
  await f.api.replaceOrderPaymentAttachment(1, 7, file);
  await f.api.deleteOrderPaymentAttachment(1, 7);
  assert.deepEqual(f.axiosCalls.map(call => call.slice(0, 2)), [['post', '/scm/order-payments/1/attachments'], ['put', '/scm/order-payments/1/attachments/7'], ['delete', '/scm/order-payments/1/attachments/7']]);
  assert.equal(f.axiosCalls[0][2].getAll('attachments').length, 2);
  assert.equal(f.axiosCalls[1][2].getAll('attachments').length, 1);
  for (const call of f.axiosCalls) {
    const config = call.at(-1);
    assert.equal(config.skipRetry, true);
    assert.equal(config.skipOfflineQueue, true);
  }
})

test('API exposes attachment permissions and normalizes database/upload errors', async () => {
  const f = await fixture({ axiosError: true });
  const permissions = f.api.useOrderPaymentAccess().permissions;
  assert.equal(permissions.can_upload_attachment, true);
  assert.equal(permissions.can_replace_attachment, true);
  assert.equal(permissions.can_remove_attachment, true);
  await assert.rejects(f.api.uploadOrderPaymentAttachments(1, [png()]), /S3 gagal/);
})

for (const paid of [false, true]) {
  test(`${paid ? 'paid' : 'pending'} detail renders editable server proofs`, async () => {
    const f = await fixture({ paid });
    f.render(true);
    assert.equal(f.managerProps().permissions.can_upload_attachment, true);
    assert.equal(f.managerProps().permissions.can_replace_attachment, true);
    assert.equal(f.managerProps().permissions.can_remove_attachment, true);
    assert.equal(f.managerProps().attachments[0].id, 7);
  });
}

test('upload updates server gallery, not browser localStorage; duplicate clicks are suppressed', async () => {
  let finish;
  const f = await fixture({ upload: () => new Promise(resolve => { finish = resolve; }) });
  const nodes = f.render();
  const input = nodes.find(node => node.type === 'input' && node.props.multiple);
  input.props.onChange({ target: { files: [png()], value: 'file' } });
  input.props.onChange({ target: { files: [png()], value: 'file' } });
  assert.equal(f.calls.length, 1);
  assert.equal(f.props.mutationLock.current, true);
  assert.ok(f.render().filter(node => node.type === 'input').every(node => node.props.disabled));
  finish([serverProof]);
  await flush();
  assert.equal(f.props.attachments.length, 2);
  assert.equal(f.storage.size, 0);
  assert.equal(f.props.mutationLock.current, false);
});

test('replace retains old proof until server success; remove targets the exact attachment ID', async () => {
  let finish;
  const f = await fixture({ replace: () => new Promise(resolve => { finish = resolve; }) });
  const replacement = f.render().find(node => node.type === 'input' && !node.props.multiple);
  replacement.props.onChange({ target: { files: [png()], value: 'file' } });
  assert.equal(f.props.attachments[0].id, 7);
  assert.deepEqual(f.calls[0].slice(0, 3), ['replace', 1, 7]);
  finish(serverProof);
  await flush();
  assert.equal(f.props.attachments[0].id, 9);
  const remove = f.render().find(node => node.type === 'IconButton' && node.props['aria-label']?.startsWith('Hapus'));
  await remove.props.onClick();
  assert.deepEqual(f.calls[1], ['delete', 1, 9]);
  assert.equal(f.props.attachments.length, 0);
});

test('read-only access renders no upload, replace or delete controls', async () => {
  const f = await fixture({ permissions: { can_upload_attachment: false, can_replace_attachment: false, can_remove_attachment: false } });
  const nodes = f.render();
  assert.ok(!nodes.some(node => node.type === 'input'));
  assert.ok(!nodes.some(node => node.props['aria-label']?.startsWith('Hapus')));
  assert.ok(nodes.some(node => text(node).includes('Anda tidak memiliki izin upload bukti')));
});

test('invalid files never call the upload API and failed replacements keep old gallery', async () => {
  const f = await fixture({ replace: async () => { throw new Error('S3 unavailable'); } });
  const nodes = f.render();
  const upload = nodes.find(node => node.type === 'input' && node.props.multiple);
  upload.props.onChange({ target: { files: [new File(['text'], 'bad.svg', { type: 'image/svg+xml' })], value: 'file' } });
  assert.equal(f.calls.length, 0);
  const replacement = nodes.find(node => node.type === 'input' && !node.props.multiple);
  replacement.props.onChange({ target: { files: [png()], value: 'file' } });
  await flush();
  assert.equal(f.props.attachments[0].id, 7);
  assert.ok(f.notices.some(notice => notice.alert.color === 'error'));
});

test('legacy drafts from both old formats survive failure and are removed only after upload succeeds', async () => {
  const proof = { name: 'draft.png', dataUrl: `data:image/png;base64,${Buffer.from('89504e470d0a1a0a', 'hex').toString('base64')}` };
  for (const fail of [false, true]) {
    const f = await fixture({ drafts: { __header: [proof], 12: proof }, upload: async () => { if (fail) throw new Error('offline'); return [serverProof]; } });
    f.render();
    const button = f.render().find(node => node.type === 'Button' && text(node) === 'Unggah draft ke server');
    await button.props.onClick();
    assert.equal(f.calls[0][2].length, 1, 'duplicate draft images must be migrated once');
    assert.equal(f.storage.has('order-payment-proofs:1'), fail);
  }
});

test('cache updates preserve detail envelope, historic proof URLs and document financial fields', async () => {
  const { utils } = await fixture();
  for (const key of ['rows', 'data']) {
    const payload = { diagnostic: { error: false }, [key]: { status: 'paid', roundtotal: 100, payment_attachments: [{ id: 7 }, { url: '/legacy.jpg' }] } };
    const appended = utils.applyPaymentAttachmentChange(payload, null, { files: [serverProof] });
    assert.equal(appended[key].payment_attachments.length, 3);
    const replaced = utils.applyPaymentAttachmentChange(appended, null, { removedId: 7, files: [serverProof] });
    assert.equal(replaced[key].payment_attachments.length, 2);
    assert.equal(replaced[key].status, 'paid');
    assert.equal(replaced[key].roundtotal, 100);
    assert.equal(payload[key].payment_attachments.length, 2);
  }
});

test('upload/cache refresh preserves in-progress payment narrative and shares the posting lock', async () => {
  const f = await fixture();
  f.render(true);
  await flush();
  let nodes = f.render(true);
  nodes.find(node => node.type === 'TextField' && node.props.label === 'Narasi').props.onChange({ target: { value: 'Draft narrative' } });
  nodes.find(node => node.type === 'Autocomplete').props.onChange(null, { id: 3 });
  nodes = f.render(true);
  const post = nodes.find(node => node.type === 'Button' && text(node) === 'Posting Bayar');
  assert.equal(post.props.disabled, false);
  const props = f.managerProps();
  await props.onChanged({ files: [serverProof] });
  props.onBusyChange(true);
  props.mutationLock.current = true;
  nodes = f.render(true);
  assert.equal(nodes.find(node => node.type === 'TextField' && node.props.label === 'Narasi').props.value, 'Draft narrative');
  const disabledPost = nodes.find(node => node.type === 'Button' && text(node) === 'Posting Bayar');
  assert.equal(disabledPost.props.disabled, true);
  await disabledPost.props.onClick();
  assert.ok(!f.calls.some(call => call[0] === 'post-payment'));
});
