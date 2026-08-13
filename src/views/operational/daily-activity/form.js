'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, FormControl,
  FormHelperText, Grid, IconButton, InputLabel, MenuItem, Select, Stack, Tab, Tabs, TextField, Typography
} from '@mui/material';
import { Add, Trash } from 'iconsax-react';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  createDailyActivity, getDailyActivityMasters, updateDailyActivityStatus, useDailyActivity, useDailyActivityAccess
} from 'api/daily-activity';
import {
  STATUSES, emptyBatch, emptyHeader, groupItemsIntoBatches, normalizeDetail, optionLabel, serializeBatch
} from './utils';

const categories = [{ id: 'mining', nama: 'MINING' }, { id: 'rental', nama: 'RENTAL' }, { id: 'explorasi', nama: 'EXPLORASI' }];
const weather = ['Cerah', 'Mendung', 'Hujan'];
const unitCategories = ['HE', 'DT', 'Drill'];
const EMPTY_MASTERS = { sites: [], pits: [], equipments: [], operators: [], supervisors: [], activities: [], materials: [], contractors: [] };

function selectValue(options, id) {
  return options.find((option) => String(option.id) === String(id)) || null;
}

function MasterSelect({ label, options, value, onChange, error, disabled = false }) {
  return (
    <Autocomplete
      options={options}
      value={selectValue(options, value)}
      onChange={(_, option) => onChange(option)}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
      disabled={disabled}
      renderInput={(params) => <TextField {...params} label={label} error={!!error} helperText={error} />}
    />
  );
}

function BatchCard({ batch, index, masters, header, usedEquipment, errors, onChange, onRemove }) {
  const allowedCategories = header.ctgunit.toUpperCase() === 'DRILL' ? ['AD', 'MD'] : [header.ctgunit.toUpperCase()];
  const equipmentOptions = masters.equipments.filter((item) => {
    const id = String(item.id);
    const categoryAllowed = !header.ctgunit || allowedCategories.includes(String(item.kategori || '').toUpperCase());
    return categoryAllowed && (!usedEquipment.has(id) || batch.equipment_ids.includes(id));
  });
  const activities = masters.activities.filter((item) => {
    const subcategory = String(item.subctg || '').toLowerCase();
    if (batch.status === 'breakdown') return subcategory === 'breakdown';
    if (batch.status === 'standby') return subcategory === 'standby';
    return subcategory !== 'breakdown' && subcategory !== 'standby';
  });
  const activityOptions = activities.length ? activities : masters.activities;

  const patchAssignment = (equipmentId, values) => onChange({
    equipment_assignments: {
      ...batch.equipment_assignments,
      [equipmentId]: { ...(batch.equipment_assignments[equipmentId] || {}), ...values }
    }
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={STATUSES.find((item) => item.id === batch.status)?.label} color={STATUSES.find((item) => item.id === batch.status)?.color} size="small" />
            <Typography variant="subtitle1">Batch {index + 1}</Typography>
          </Stack>
          <IconButton color="error" onClick={onRemove} aria-label="Hapus batch"><Trash size={20} /></IconButton>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={2}><TextField fullWidth label="Sequence" value={batch.sequence} onChange={(e) => onChange({ sequence: e.target.value })} /></Grid>
          <Grid item xs={12} sm={5}><TextField fullWidth type="datetime-local" label="Waktu Start" value={batch.start_time} onChange={(e) => onChange({ start_time: e.target.value })} InputLabelProps={{ shrink: true }} error={!!errors.start_time} helperText={errors.start_time} /></Grid>
          <Grid item xs={12} sm={5}><TextField fullWidth type="datetime-local" label="Waktu Finish" value={batch.finish_time} onChange={(e) => onChange({ finish_time: e.target.value })} InputLabelProps={{ shrink: true }} error={!!errors.finish_time} helperText={errors.finish_time} /></Grid>
          <Grid item xs={12} md={6}>
            <MasterSelect label="Kegiatan" options={activityOptions} value={batch.kegiatan_id} error={errors.kegiatan_id} onChange={(item) => onChange({ kegiatan_id: String(item?.id || ''), kegiatan_name: optionLabel(item) })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <MasterSelect label="Material" options={masters.materials} value={batch.material_id} disabled={batch.status !== 'beroperasi'} onChange={(item) => onChange({ material_id: String(item?.id || ''), material_name: optionLabel(item) })} />
          </Grid>
          {batch.status === 'breakdown' && <Grid item xs={12} md={6}><MasterSelect label="Pengawas" options={masters.supervisors} value={batch.pengawas_id} onChange={(item) => onChange({ pengawas_id: String(item?.id || ''), pengawas_name: optionLabel(item) })} /></Grid>}
          {batch.status === 'breakdown' && <Grid item xs={12} md={6}><TextField fullWidth label="Issue Breakdown" value={batch.issue_breakdown} onChange={(e) => onChange({ issue_breakdown: e.target.value })} error={!!errors.issue_breakdown} helperText={errors.issue_breakdown} /></Grid>}
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Keterangan Batch" value={batch.note} onChange={(e) => onChange({ note: e.target.value })} /></Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={equipmentOptions}
              value={equipmentOptions.filter((item) => batch.equipment_ids.includes(String(item.id)))}
              onChange={(_, options) => {
                const equipmentIds = options.map((item) => String(item.id));
                const assignments = Object.fromEntries(Object.entries(batch.equipment_assignments).filter(([id]) => equipmentIds.includes(id)));
                onChange({ equipment_ids: equipmentIds, equipment_assignments: assignments });
              }}
              getOptionLabel={(item) => `${item.kode || optionLabel(item)}${item.model ? ` - ${item.model}` : ''}`}
              isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
              renderInput={(params) => <TextField {...params} label="Multi Equipment" error={!!errors.equipment_ids} helperText={errors.equipment_ids} />}
            />
          </Grid>
        </Grid>
        {batch.equipment_ids.length > 0 && <Divider sx={{ my: 2 }} />}
        <Stack spacing={1.5}>
          {batch.equipment_ids.map((equipmentId) => {
            const equipment = selectValue(masters.equipments, equipmentId) || {};
            const assignment = batch.equipment_assignments[equipmentId] || {};
            const category = String(equipment.kategori || '').toUpperCase();
            const operators = masters.operators.filter((item) => {
              const text = `${item.section || ''} ${item.jabatan || ''} ${item.position || ''}`.toLowerCase();
              if (category === 'DT') return text.includes('driver') || text.includes('drv');
              if (category === 'HE') return text.includes('operator') || text.includes('opr');
              return true;
            });
            return (
              <Grid container spacing={2} alignItems="center" key={equipmentId}>
                <Grid item xs={12} md={3}><Typography fontWeight={700}>{equipment.kode || equipmentId}</Typography><Typography variant="caption" color="text.secondary">{equipment.model || category || '-'}</Typography></Grid>
                <Grid item xs={12} md={batch.status === 'breakdown' ? 6 : 9}>
                  <MasterSelect label="Operator / Driver" options={operators.length ? operators : masters.operators} value={assignment.karyawan_id} onChange={(item) => patchAssignment(equipmentId, { karyawan_id: String(item?.id || ''), karyawan_name: optionLabel(item) })} />
                </Grid>
                {batch.status === 'breakdown' && <Grid item xs={12} md={3}><TextField fullWidth label="HM/KM sebelum BD" value={assignment.hm_km_bd || ''} onChange={(e) => patchAssignment(equipmentId, { hm_km_bd: e.target.value })} /></Grid>}
              </Grid>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DailyActivityForm({ headerId = null }) {
  const edit = !!headerId;
  const router = useRouter();
  const { data: session } = useSession();
  const { permissions, accessLoading, accessError } = useDailyActivityAccess();
  const { data: detail, dataLoading: detailLoading, dataError } = useDailyActivity(headerId, edit && permissions.read);
  const [header, setHeader] = useState(emptyHeader);
  const [batches, setBatches] = useState([]);
  const [activeStatus, setActiveStatus] = useState('beroperasi');
  const [masters, setMasters] = useState(EMPTY_MASTERS);
  const [masterLoading, setMasterLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ header: {}, batches: {} });

  useEffect(() => {
    let mounted = true;
    getDailyActivityMasters().then((value) => mounted && setMasters(value)).catch((error) => openNotification({ message: error?.message || 'Gagal memuat master data', type: 'error' })).finally(() => mounted && setMasterLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!edit || !detail || !normalizeDetail(detail).header?.id) return;
    const normalized = normalizeDetail(detail);
    setHeader({ ...emptyHeader(), ...normalized.header, shift_id: String(normalized.header.shift_id || '1') });
    setBatches(groupItemsIntoBatches(normalized.items));
  }, [detail, edit]);

  const statusBatches = batches.filter((batch) => batch.status === activeStatus);
  const usedEquipment = useMemo(() => new Set(batches.flatMap((batch) => batch.equipment_ids)), [batches]);

  const updateHeader = (patch) => setHeader((current) => ({ ...current, ...patch }));
  const updateBatch = (id, patch) => setBatches((current) => current.map((batch) => batch.client_id === id ? { ...batch, ...patch } : batch));
  const addBatch = () => setBatches((current) => [...current, emptyBatch(activeStatus, header.date_ops, header.shift_id)]);

  const validate = () => {
    const headerErrors = {};
    ['date_ops', 'shift_id', 'lokasi_site_id', 'lokasi_pit_id', 'kontraktor', 'cuaca', 'category_id', 'ctgunit'].forEach((key) => {
      if (!header[key]) headerErrors[key] = 'Wajib diisi';
    });
    const batchErrors = {};
    if (!batches.length) headerErrors.batches = 'Minimal satu batch wajib ditambahkan';
    const duplicate = new Set();
    const seen = new Set();
    batches.forEach((batch) => batch.equipment_ids.forEach((id) => seen.has(id) ? duplicate.add(id) : seen.add(id)));
    batches.forEach((batch) => {
      const value = {};
      if (!batch.start_time) value.start_time = 'Wajib diisi';
      if (!batch.finish_time) value.finish_time = 'Wajib diisi';
      if (batch.start_time && batch.finish_time && new Date(batch.finish_time) <= new Date(batch.start_time)) value.finish_time = 'Harus setelah waktu start';
      if (!batch.kegiatan_id) value.kegiatan_id = 'Kegiatan wajib dipilih';
      if (!batch.equipment_ids.length) value.equipment_ids = 'Minimal satu equipment wajib dipilih';
      if (batch.equipment_ids.some((id) => duplicate.has(id))) value.equipment_ids = 'Equipment hanya boleh digunakan pada satu batch/status';
      if (batch.status === 'breakdown' && !batch.issue_breakdown.trim()) value.issue_breakdown = 'Issue breakdown wajib diisi';
      batchErrors[batch.client_id] = value;
    });
    setErrors({ header: headerErrors, batches: batchErrors });
    return !Object.keys(headerErrors).length && Object.values(batchErrors).every((value) => !Object.keys(value).length);
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const headerPayload = {
      ...header,
      shift_id: Number(header.shift_id),
      author_id: session?.employee_id || session?.id || 0,
      cabang_id: session?.cabang_id || 1
    };
    try {
      if (edit) {
        for (const status of STATUSES) {
          const items = batches.filter((batch) => batch.status === status.id).map(serializeBatch);
          await updateDailyActivityStatus(headerId, status.id, headerPayload, items);
        }
      } else {
        await createDailyActivity({ ...headerPayload, items: batches.map(serializeBatch) });
      }
      openNotification({ message: edit ? 'Daily activity berhasil diperbarui' : 'Daily activity berhasil disimpan', type: 'success' });
      router.push('/daily-activity');
      router.refresh();
    } catch (error) {
      openNotification({ message: error?.diagnostic?.message || error?.message || 'Gagal menyimpan daily activity', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (accessLoading || masterLoading || (edit && detailLoading)) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;
  if (accessError || dataError) return <Alert severity="error">Gagal memuat data. Pastikan koneksi internet tersedia.</Alert>;
  if ((!edit && !permissions.insert) || (edit && (!permissions.read || !permissions.update))) return <Alert severity="warning">Anda tidak memiliki akses untuk {edit ? 'mengubah' : 'membuat'} daily activity.</Alert>;

  return (
    <>
      <Breadcrumbs custom heading={edit ? 'Edit Daily Activity' : 'Buat Daily Activity'} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Daily Activity', to: '/daily-activity' }, { title: edit ? 'Edit' : 'Buat' }]} />
      <MainCard title="Informasi Umum">
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><TextField fullWidth type="date" label="Tanggal" value={header.date_ops} onChange={(e) => updateHeader({ date_ops: e.target.value })} InputLabelProps={{ shrink: true }} error={!!errors.header.date_ops} helperText={errors.header.date_ops} /></Grid>
          <Grid item xs={12} md={3}><FormControl fullWidth error={!!errors.header.shift_id}><InputLabel>Shift</InputLabel><Select label="Shift" value={header.shift_id} onChange={(e) => updateHeader({ shift_id: e.target.value })}><MenuItem value="1">Siang</MenuItem><MenuItem value="2">Malam</MenuItem></Select><FormHelperText>{errors.header.shift_id}</FormHelperText></FormControl></Grid>
          <Grid item xs={12} md={3}><MasterSelect label="Site Penyewa" options={masters.sites} value={header.lokasi_site_id} error={errors.header.lokasi_site_id} onChange={(item) => updateHeader({ lokasi_site_id: String(item?.id || ''), lokasi_site_nama: optionLabel(item) })} /></Grid>
          <Grid item xs={12} md={3}><MasterSelect label="Lokasi Pit" options={masters.pits} value={header.lokasi_pit_id} error={errors.header.lokasi_pit_id} onChange={(item) => updateHeader({ lokasi_pit_id: String(item?.id || ''), lokasi_pit_nama: optionLabel(item) })} /></Grid>
          <Grid item xs={12} md={3}><MasterSelect label="Kontraktor" options={masters.contractors} value={masters.contractors.find((item) => optionLabel(item) === header.kontraktor)?.id} error={errors.header.kontraktor} onChange={(item) => updateHeader({ kontraktor: optionLabel(item) })} /></Grid>
          <Grid item xs={12} md={3}><FormControl fullWidth error={!!errors.header.cuaca}><InputLabel>Cuaca</InputLabel><Select label="Cuaca" value={header.cuaca} onChange={(e) => updateHeader({ cuaca: e.target.value })}>{weather.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select><FormHelperText>{errors.header.cuaca}</FormHelperText></FormControl></Grid>
          <Grid item xs={12} md={3}><MasterSelect label="Kategori Kegiatan" options={categories} value={header.category_id} error={errors.header.category_id} onChange={(item) => updateHeader({ category_id: item?.id || '' })} /></Grid>
          <Grid item xs={12} md={3}><FormControl fullWidth error={!!errors.header.ctgunit}><InputLabel>Kategori Unit</InputLabel><Select label="Kategori Unit" value={header.ctgunit} onChange={(e) => updateHeader({ ctgunit: e.target.value })}>{unitCategories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select><FormHelperText>{errors.header.ctgunit}</FormHelperText></FormControl></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Catatan Umum" value={header.notes || ''} onChange={(e) => updateHeader({ notes: e.target.value })} /></Grid>
        </Grid>
      </MainCard>
      <MainCard sx={{ mt: 2 }} title="Status dan Batch" secondary={<Button startIcon={<Add />} variant="contained" onClick={addBatch}>Tambah Batch</Button>}>
        <Tabs value={activeStatus} onChange={(_, value) => setActiveStatus(value)} variant="fullWidth" sx={{ mb: 2 }}>
          {STATUSES.map((status) => <Tab key={status.id} value={status.id} label={`${status.label} (${batches.filter((batch) => batch.status === status.id).length})`} />)}
        </Tabs>
        {errors.header.batches && <Alert severity="warning" sx={{ mb: 2 }}>{errors.header.batches}</Alert>}
        <Stack spacing={2}>
          {statusBatches.map((batch, index) => <BatchCard key={batch.client_id} batch={batch} index={index} masters={masters} header={header} usedEquipment={usedEquipment} errors={errors.batches[batch.client_id] || {}} onChange={(patch) => updateBatch(batch.client_id, patch)} onRemove={() => setBatches((current) => current.filter((item) => item.client_id !== batch.client_id))} />)}
          {!statusBatches.length && <Alert severity="info">Belum ada batch {STATUSES.find((item) => item.id === activeStatus)?.label}. Klik Tambah Batch.</Alert>}
        </Stack>
      </MainCard>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2 }}>
        <Button component={Link} href="/daily-activity" color="secondary">Batal</Button>
        <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Menyimpan...' : edit ? 'Simpan Perubahan' : 'Simpan Daily Activity'}</Button>
      </Stack>
    </>
  );
}
