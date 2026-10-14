const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const utils = import(`data:text/javascript;base64,${fs.readFileSync(path.resolve(__dirname, '../src/views/operational/daily-activity/utils.js')).toString('base64')}`);

test('grouping and serialization preserve source item IDs for in-place realization', async () => {
  const { groupItemsIntoBatches, serializeBatch } = await utils;
  const common = { status: 'beroperasi', start_time: '2026-10-13 07:00:00', finish_time: '2026-10-13 18:00:00', kegiatan_id: '9', material_id: '5' };
  const batches = groupItemsIntoBatches([
    { ...common, id: 101, equipment_id: '10', karyawan_id: '7' },
    { ...common, id: 102, equipment_id: '20', karyawan_id: '8' }
  ]);
  assert.equal(batches.length, 1);
  const payload = serializeBatch(batches[0]);
  assert.deepEqual(payload.item_ids, { 10: 101, 20: 102 });
  assert.deepEqual(payload.equipment_ids, ['10', '20']);
  assert.equal(payload.equipment_assignments['20'].karyawan_id, '8');
  assert.equal(payload.start_time, common.start_time);
});

test('duplicating a batch never reuses persisted source item IDs', async () => {
  const { groupItemsIntoBatches, nextBatch, serializeBatch } = await utils;
  const [batch] = groupItemsIntoBatches([{ id: 101, equipment_id: '10', status: 'beroperasi', start_time: '2026-10-13 07:00:00', finish_time: '2026-10-13 08:00:00' }]);
  const copy = nextBatch(batch);
  assert.deepEqual(serializeBatch(copy).item_ids, {});
  assert.deepEqual(batch.item_ids, { 10: 101 });
  assert.notEqual(copy.equipment_assignments, batch.equipment_assignments);
});

test('rescheduling cloned plans aligns night-shift finish to the following day', async () => {
  const { emptyBatch, moveBatchToSchedule, serializeBatch } = await utils;
  const batch = { ...emptyBatch('beroperasi', '2026-10-12', '1'), item_ids: {} };
  const shifted = moveBatchToSchedule(batch, '2026-10-13', '1', '2');
  const payload = serializeBatch(shifted);
  assert.equal(payload.start_time, '2026-10-13 18:00:00');
  assert.equal(payload.finish_time, '2026-10-14 05:00:00');
});
