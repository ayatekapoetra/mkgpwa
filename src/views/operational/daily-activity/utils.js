export const STATUSES = [
  { id: 'beroperasi', label: 'Beroperasi', color: 'success' },
  { id: 'standby', label: 'Standby', color: 'warning' },
  { id: 'breakdown', label: 'Breakdown', color: 'error' }
];

export const REQUIRED_EQUIPMENT_ACTIVITY_IDS = new Set([
  '77', '40', '41', '42', '43', '47', '66', '78', '79', '80', '81', '45', '68', '46', '65', '74', '1', '48', '67'
]);

export const getLocalDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const toLocalDateTime = (date) => {
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const addDays = (date, days) => {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return getLocalDate(value);
};

export const emptyHeader = () => ({
  date_ops: getLocalDate(),
  shift_id: '1',
  area: '',
  cabang_id: '',
  lokasi_site_id: '',
  lokasi_site_nama: '',
  lokasi_pit_id: '',
  lokasi_pit_nama: '',
  kontraktor: '',
  cuaca: '',
  category_id: '',
  ctgunit: '',
  notes: ''
});

export const emptyBatch = (status, date = getLocalDate(), shift = '1') => ({
  client_id: `${status}-${Date.now()}-${Math.random()}`,
  status,
  sequence: '',
  start_time: `${date}T${shift === '1' ? '07:00' : '18:00'}`,
  finish_time: `${shift === '1' ? date : new Date(new Date(`${date}T00:00:00`).getTime() + 86400000).toISOString().slice(0, 10)}T${shift === '1' ? '18:00' : '06:00'}`,
  kegiatan_id: '',
  kegiatan_name: '',
  material_id: '',
  material_name: '',
  pengawas_id: '',
  pengawas_name: '',
  issue_breakdown: '',
  note: '',
  equipment_ids: [],
  equipment_assignments: {}
});

export function nextBatch(source, status = source.status) {
  const start = new Date(source.finish_time);
  const sourceStart = new Date(source.start_time);
  const sourceFinish = new Date(source.finish_time);
  const duration = sourceFinish > sourceStart ? sourceFinish.getTime() - sourceStart.getTime() : 60 * 60 * 1000;
  const finish = new Date(start.getTime() + duration);
  const toLocalInput = (value) => {
    const offset = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 16);
  };

  return {
    ...source,
    client_id: `${status}-${Date.now()}-${Math.random()}`,
    status,
    start_time: Number.isNaN(start.getTime()) ? source.start_time : toLocalInput(start),
    finish_time: Number.isNaN(finish.getTime()) ? source.finish_time : toLocalInput(finish),
    equipment_ids: [...source.equipment_ids],
    equipment_assignments: Object.fromEntries(
      Object.entries(source.equipment_assignments).map(([id, assignment]) => [id, { ...assignment }])
    )
  };
}

export function alignBatchToOperation(batch, date, shift) {
  const startClock = String(batch.start_time || '').slice(11, 16);
  const finishClock = String(batch.finish_time || '').slice(11, 16);
  if (!date || !startClock || !finishClock) return batch;

  const isNightShift = String(shift) === '2';
  const startHour = Number(startClock.slice(0, 2));
  const startDate = isNightShift && startHour < 7 ? addDays(date, 1) : date;
  const start = new Date(`${startDate}T${startClock}:00`);
  let finish = new Date(`${startDate}T${finishClock}:00`);
  if (finish <= start) finish.setDate(finish.getDate() + 1);

  return { ...batch, start_time: toLocalDateTime(start), finish_time: toLocalDateTime(finish) };
}

export function moveBatchToSchedule(batch, date, previousShift, nextShift) {
  const aligned = alignBatchToOperation(batch, date, previousShift);
  if (String(previousShift) === String(nextShift)) return aligned;

  const start = new Date(aligned.start_time);
  const finish = new Date(aligned.finish_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) return emptyBatch(batch.status, date, nextShift);

  const previousAnchor = new Date(`${date}T${String(previousShift) === '2' ? '18:00' : '07:00'}:00`);
  const nextAnchor = new Date(`${date}T${String(nextShift) === '2' ? '18:00' : '07:00'}:00`);
  const offset = start.getTime() - previousAnchor.getTime();
  const duration = finish.getTime() - start.getTime();
  const nextStart = new Date(nextAnchor.getTime() + offset);
  const nextFinish = new Date(nextStart.getTime() + duration);

  return { ...batch, start_time: toLocalDateTime(nextStart), finish_time: toLocalDateTime(nextFinish) };
}

export const optionLabel = (option) => option?.nama || option?.name || option?.kode || option?.teks || '';

export const getHeaderId = (row) => row?.first_header_id || row?.header_id || row?.header?.id || row?.id;

export function normalizeDetail(payload) {
  const source = payload?.data && payload.data.header ? payload.data : payload;
  return { header: source?.header || {}, items: Array.isArray(source?.items) ? source.items : [] };
}

export function groupItemsIntoBatches(items = []) {
  const groups = new Map();
  items.forEach((item) => {
    const key = [item.status, item.sequence, item.start_time, item.finish_time, item.kegiatan_id, item.material_id, item.pengawas_id, item.issue_breakdown, item.note].join('|');
    if (!groups.has(key)) {
      groups.set(key, {
        ...emptyBatch(String(item.status || '').toLowerCase()),
        sequence: item.sequence || '',
        start_time: String(item.start_time || '').replace(' ', 'T').slice(0, 16),
        finish_time: String(item.finish_time || '').replace(' ', 'T').slice(0, 16),
        kegiatan_id: String(item.kegiatan_id || ''),
        kegiatan_name: item.kegiatan_name || '',
        material_id: String(item.material_id || ''),
        material_name: item.material_name || '',
        pengawas_id: String(item.pengawas_id || ''),
        pengawas_name: item.pengawas_name || '',
        issue_breakdown: item.issue_breakdown || '',
        note: item.note || '',
        equipment_ids: [],
        equipment_assignments: {}
      });
    }
    if (item.equipment_id) {
      const group = groups.get(key);
      const equipmentId = String(item.equipment_id);
      if (!group.equipment_ids.includes(equipmentId)) group.equipment_ids.push(equipmentId);
      group.equipment_assignments[equipmentId] = {
        karyawan_id: String(item.karyawan_id || ''),
        karyawan_name: item.karyawan_name || '',
        hm_km_bd: item.hm_km_bd || item.hm_km_before_breakdown || ''
      };
    }
  });
  return [...groups.values()];
}

export function serializeBatch(batch) {
  return {
    status: batch.status,
    sequence: batch.sequence,
    start_time: String(batch.start_time || '').replace('T', ' ') + (String(batch.start_time || '').length === 16 ? ':00' : ''),
    finish_time: String(batch.finish_time || '').replace('T', ' ') + (String(batch.finish_time || '').length === 16 ? ':00' : ''),
    kegiatan_id: batch.kegiatan_id,
    kegiatan_name: batch.kegiatan_name,
    material_id: batch.material_id,
    material_name: batch.material_name,
    pengawas_id: batch.pengawas_id,
    pengawas_name: batch.pengawas_name,
    issue_breakdown: batch.issue_breakdown,
    note: batch.note,
    equipment_ids: batch.equipment_ids,
    equipment_assignments: batch.equipment_assignments
  };
}
