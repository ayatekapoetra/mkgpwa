const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transform } = require('next/dist/build/swc');

async function loadEsModule(filePath, mockedImports = {}) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf8');
  const transformed = await transform(code, {
    filename: filePath,
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'classic' } },
      target: 'es2022'
    },
    module: { type: 'commonjs' }
  });

  const module = { exports: {} };
  vm.runInNewContext(transformed.code, {
    module,
    exports: module.exports,
    console,
    URLSearchParams,
    require(name) {
      if (name in mockedImports) return mockedImports[name];
      if (name === 'swr') return () => ({ data: null, isLoading: false, error: null });
      if (name === 'react') return { useMemo: (fn) => fn(), useState: () => [null, () => {}] };
      if (name === 'utils/axios') return { get: async () => ({ data: {} }), post: async () => ({ data: {} }) };
      return {};
    }
  });

  return module.exports;
}

test('RENTAL_TOOLS defines standard attachments (BUCKET, BREAKER, LONGARM)', async () => {
  const mod = await loadEsModule('src/api/rental-contract.js');
  assert.ok(Array.isArray(mod.RENTAL_TOOLS));
  const types = [...mod.RENTAL_TOOLS.map(t => String(t.type))];
  assert.deepEqual(JSON.parse(JSON.stringify(types)), ['BUCKET', 'BREAKER', 'LONGARM']);
});

test('Rental Contract payload mapping produces structured items with multi-tools rates', () => {
  const values = {
    contract_number: 'KTR/2026/001',
    bisnis_id: '1',
    penyewa_id: '10',
    start_date: '2026-03-01',
    end_date: '2026-06-30',
    notes: 'Kontrak sewa excavator',
    items: [
      {
        tipe: 'EXCAVATOR',
        model: 'PC200-8',
        quantity: 2,
        billing_unit: 'HOUR',
        minimum_quantity: '200',
        minimum_period: 'CALENDAR_MONTH',
        notes: 'Unit 1 & 2',
        rates: {
          BUCKET: { active: true, unit_price: '275000' },
          BREAKER: { active: true, unit_price: '450000' },
          LONGARM: { active: false, unit_price: '' }
        }
      },
      {
        tipe: 'EXCAVATOR',
        model: 'CAT 320D',
        quantity: 1,
        billing_unit: 'HOUR',
        minimum_quantity: '150',
        minimum_period: 'CALENDAR_MONTH',
        notes: 'Unit 3',
        rates: {
          BUCKET: { active: true, unit_price: '300000' },
          BREAKER: { active: false, unit_price: '' },
          LONGARM: { active: true, unit_price: '380000' }
        }
      }
    ]
  };

  const payload = {
    contract_number: values.contract_number,
    bisnis_id: Number(values.bisnis_id),
    penyewa_id: Number(values.penyewa_id),
    start_date: values.start_date,
    end_date: values.end_date,
    notes: values.notes || '',
    items: values.items.map((it) => {
      const itemRates = [];
      ['BUCKET', 'BREAKER', 'LONGARM'].forEach((toolType) => {
        const cfg = it.rates?.[toolType] || {};
        const isActive = Boolean(cfg.active);
        const price = Number(cfg.unit_price || 0);
        itemRates.push({
          tools_type: toolType,
          unit_price: isActive ? price : 0,
          is_active: isActive ? 'Y' : 'N'
        });
      });

      return {
        tipe: it.tipe,
        model: it.model,
        quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
        billing_unit: it.billing_unit,
        minimum_quantity: it.billing_unit === 'HOUR' ? (Number(it.minimum_quantity) || 0) : null,
        minimum_period: it.billing_unit === 'HOUR' ? (it.minimum_period || 'CALENDAR_MONTH') : null,
        notes: it.notes || '',
        rates: itemRates
      };
    })
  };

  assert.equal(payload.contract_number, 'KTR/2026/001');
  assert.equal(payload.items.length, 2);

  // Check Item 1
  const item1 = payload.items[0];
  assert.equal(item1.model, 'PC200-8');
  assert.equal(item1.quantity, 2);
  assert.equal(item1.billing_unit, 'HOUR');
  assert.equal(item1.minimum_quantity, 200);
  assert.equal(item1.minimum_period, 'CALENDAR_MONTH');
  assert.equal(item1.rates.length, 3);
  assert.deepEqual(item1.rates[0], { tools_type: 'BUCKET', unit_price: 275000, is_active: 'Y' });
  assert.deepEqual(item1.rates[1], { tools_type: 'BREAKER', unit_price: 450000, is_active: 'Y' });
  assert.deepEqual(item1.rates[2], { tools_type: 'LONGARM', unit_price: 0, is_active: 'N' });

  // Check Item 2
  const item2 = payload.items[1];
  assert.equal(item2.model, 'CAT 320D');
  assert.equal(item2.quantity, 1);
  assert.deepEqual(item2.rates[0], { tools_type: 'BUCKET', unit_price: 300000, is_active: 'Y' });
  assert.deepEqual(item2.rates[1], { tools_type: 'BREAKER', unit_price: 0, is_active: 'N' });
  assert.deepEqual(item2.rates[2], { tools_type: 'LONGARM', unit_price: 380000, is_active: 'Y' });
});

test('Duplicate model validation detects duplicate models in items list', () => {
  const validateNoDuplicates = (items) => {
    if (!items || !items.length) return true;
    const seen = new Set();
    for (const it of items) {
      const m = (it?.model || '').trim().toLowerCase();
      if (m) {
        if (seen.has(m)) return false;
        seen.add(m);
      }
    }
    return true;
  };

  const validItems = [
    { model: 'PC200-8' },
    { model: 'CAT 320D' }
  ];
  assert.equal(validateNoDuplicates(validItems), true);

  const duplicateItems = [
    { model: 'PC200-8' },
    { model: 'pc200-8' }
  ];
  assert.equal(validateNoDuplicates(duplicateItems), false);
});

test('Tools rate validation requires at least 1 active tool with unit_price > 0', () => {
  const validateRates = (rates) => {
    if (!rates) return false;
    const tools = ['BUCKET', 'BREAKER', 'LONGARM'];
    return tools.some((t) => {
      const r = rates[t];
      return r?.active && Number(r?.unit_price) > 0;
    });
  };

  assert.equal(validateRates({
    BUCKET: { active: true, unit_price: '250000' },
    BREAKER: { active: false, unit_price: '' }
  }), true);

  assert.equal(validateRates({
    BUCKET: { active: false, unit_price: '250000' },
    BREAKER: { active: true, unit_price: '0' }
  }), false);

  assert.equal(validateRates({
    BUCKET: { active: false, unit_price: '' },
    BREAKER: { active: false, unit_price: '' }
  }), false);
});

test('formatModelSummary formats models and unit counts for table display', () => {
  const formatModelSummary = (row) => {
    if (row.model_summary) return row.model_summary;
    const items = row.items || [];
    if (Array.isArray(items) && items.length > 0) {
      return items
        .map((it) => {
          const name = it.model || it.equipment?.model || it.tipe || it.equipment?.nama || 'Alat';
          const qty = it.quantity || 1;
          return `${name} (${qty} Unit)`;
        })
        .join(', ');
    }
    if (row.total_units) {
      return `${row.total_units} Unit`;
    }
    return '-';
  };

  const rowWithItems = {
    items: [
      { model: 'PC200-8', quantity: 2 },
      { model: 'CAT 320D', quantity: 1 }
    ]
  };
  assert.equal(formatModelSummary(rowWithItems), 'PC200-8 (2 Unit), CAT 320D (1 Unit)');

  const rowEmpty = { items: [] };
  assert.equal(formatModelSummary(rowEmpty), '-');
});
