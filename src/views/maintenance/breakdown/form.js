'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import 'moment/locale/id';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Add, Trash } from 'iconsax-react';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import LoadingButton from 'components/@extended/LoadingButton';
import MainCard from 'components/MainCard';
import { openNotification } from 'api/notification';
import {
  createDailyBreakdown,
  updateDailyBreakdown,
  useBreakdownDetail,
  getBreakdownMasters
} from 'api/daily-breakdown-form';
import { ITEM_STATUS, KATEGORI, parseApiDate, validateBreakdownForm } from './utils';

moment.locale('id');

const emptyForm = {
  equipment_id: '',
  lokasi_id: '',
  breakdown_at: '',
  smu: '',
  hmkm_start: '',
  hmkm_end: '',
  shift_id: '',
  pengawas_id: '',
  penyewa_id: '',
  kategori: '',
  items: [{ problem_issue: '', status: 'WT' }]
};

const EMPTY_MASTERS = { cabangs: [], equipments: [], lokasis: [], penyewas: [], shifts: [], pengawases: [] };

export default function BreakdownForm({ headerId }) {
  const router = useRouter();
  const isEdit = !!headerId;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [masters, setMasters] = useState(EMPTY_MASTERS);

  const { data: detail, dataLoading } = useBreakdownDetail(headerId, isEdit);

  useEffect(() => {
    let mounted = true;
    getBreakdownMasters()
      .then((result) => {
        if (mounted) {
          setMasters(result);
          if (result._failed.length > 0) {
            openNotification({
              open: true,
              message: `Beberapa data master gagal dimuat: ${result._failed.join(', ')}`,
              alert: { color: 'warning', variant: 'filled' },
              variant: 'alert'
            });
          }
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isEdit && detail) {
      const m = parseApiDate(detail.breakdown_at);
      setForm({
        equipment_id: detail.equipment_id || '',
        lokasi_id: detail.lokasi_id || '',
        breakdown_at: m ? m.format('YYYY-MM-DDTHH:mm') : '',
        smu: detail.smu || '',
        hmkm_start: detail.hmkm_start || '',
        hmkm_end: detail.hmkm_end || '',
        shift_id: detail.shift_id || '',
        pengawas_id: detail.pengawas_id || '',
        penyewa_id: detail.penyewa_id || '',
        kategori: detail.kategori || '',
        items:
          Array.isArray(detail.items) && detail.items.length > 0
            ? detail.items.map((it) => ({
                id: it.id,
                problem_issue: it.problem_issue || '',
                status: it.status || 'WT',
                kode_wo: it.kode_wo || ''
              }))
            : [{ problem_issue: '', status: 'WT' }]
      });
    }
  }, [isEdit, detail]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { problem_issue: '', status: 'WT' }] }));

  const updateItem = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, idx) => (idx === index ? { ...it, [key]: value } : it))
    }));
    if (errors.items) setErrors((prev) => ({ ...prev, items: undefined }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, idx) => idx !== index) : prev.items
    }));
  };

  const buildPayload = () => {
    const breakdownMoment = form.breakdown_at ? moment(form.breakdown_at) : null;
    return {
      equipment_id: form.equipment_id || undefined,
      lokasi_id: form.lokasi_id || undefined,
      breakdown_at: breakdownMoment ? breakdownMoment.format('YYYY-MM-DD HH:mm:ss') : undefined,
      penyewa_id: form.penyewa_id || undefined,
      kategori: form.kategori || undefined,
      shift_id: form.shift_id || undefined,
      pengawas_id: form.pengawas_id || undefined,
      smu: form.smu ? Number(form.smu) : undefined,
      hmkm_start: form.hmkm_start ? Number(form.hmkm_start) : undefined,
      hmkm_end: form.hmkm_end ? Number(form.hmkm_end) : undefined,
      items: form.items
        .filter((it) => it.problem_issue && it.problem_issue.trim())
        .map((it) => ({
          ...(isEdit && it.id ? { id: it.id } : {}),
          problem_issue: it.problem_issue.trim(),
          status: it.status || 'WT',
          ...(it.kode_wo ? { kode_wo: it.kode_wo } : {})
        }))
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateBreakdownForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      openNotification({ open: true, message: 'Lengkapi field yang wajib diisi', alert: { color: 'warning', variant: 'filled' }, variant: 'alert' });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await updateDailyBreakdown(headerId, payload);
        openNotification({ open: true, message: 'Breakdown berhasil diupdate', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      } else {
        await createDailyBreakdown(payload);
        openNotification({ open: true, message: 'Breakdown berhasil dibuat', alert: { color: 'success', variant: 'filled' }, variant: 'alert' });
      }
      router.push('/daily-breakdown');
      router.refresh();
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menyimpan breakdown';
      openNotification({ open: true, message, alert: { color: 'error', variant: 'filled' }, variant: 'alert' });
    } finally {
      setSaving(false);
    }
  };

  const findOption = (list, id) => list.find((item) => String(item.id) === String(id)) || null;

  return (
    <Box>
      <Breadcrumbs
        custom
        heading={isEdit ? 'Edit Breakdown' : 'Buat Breakdown'}
        links={[
          { title: 'Home', to: '/home' },
          { title: 'Maintenances' },
          { title: 'Daily Breakdown', to: '/daily-breakdown' },
          { title: isEdit ? 'Edit' : 'Create' }
        ]}
      />

      {isEdit && dataLoading && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Memuat data breakdown...
          </Typography>
        </Stack>
      )}

      {(!isEdit || (!dataLoading && detail)) && (
        <form onSubmit={handleSubmit}>
          <MainCard title="Informasi Peralatan" sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={masters.equipments}
                  getOptionLabel={(option) => (option?.kode ? `${option.kode} - ${option.nama || ''}` : option?.nama || '')}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={findOption(masters.equipments, form.equipment_id)}
                  onChange={(_e, value) => setField('equipment_id', value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Equipment"
                      size="small"
                      required
                      error={!!errors.equipment_id}
                      helperText={errors.equipment_id}
                      placeholder="Pilih equipment"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={masters.lokasis}
                  getOptionLabel={(option) => option?.nama || option?.nama_lokasi || ''}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={findOption(masters.lokasis, form.lokasi_id)}
                  onChange={(_e, value) => setField('lokasi_id', value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Lokasi Kerja"
                      size="small"
                      required
                      error={!!errors.lokasi_id}
                      helperText={errors.lokasi_id}
                      placeholder="Pilih lokasi"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={masters.shifts}
                  getOptionLabel={(option) => (option?.nama ? `${option.nama}` : option?.id ? `Shift ${option.id}` : '')}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={findOption(masters.shifts, form.shift_id)}
                  onChange={(_e, value) => setField('shift_id', value?.id || '')}
                  renderInput={(params) => <TextField {...params} label="Shift" size="small" placeholder="Pilih shift" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={masters.pengawases}
                  getOptionLabel={(option) => option?.nama || option?.nama_lengkap || ''}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={findOption(masters.pengawases, form.pengawas_id)}
                  onChange={(_e, value) => setField('pengawas_id', value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pengawas"
                      size="small"
                      required
                      error={!!errors.pengawas_id}
                      helperText={errors.pengawas_id}
                      placeholder="Pilih pengawas"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={masters.penyewas}
                  getOptionLabel={(option) => option?.nama || ''}
                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                  value={findOption(masters.penyewas, form.penyewa_id)}
                  onChange={(_e, value) => setField('penyewa_id', value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Penyewa"
                      size="small"
                      required
                      error={!!errors.penyewa_id}
                      helperText={errors.penyewa_id}
                      placeholder="Pilih penyewa"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Waktu Breakdown"
                  type="datetime-local"
                  size="small"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={form.breakdown_at}
                  onChange={(e) => setField('breakdown_at', e.target.value)}
                  error={!!errors.breakdown_at}
                  helperText={errors.breakdown_at}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" error={!!errors.kategori}>
                  <InputLabel>Kategori *</InputLabel>
                  <Select label="Kategori *" value={form.kategori} onChange={(e) => setField('kategori', e.target.value)}>
                    {KATEGORI.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.kategori && <Typography variant="caption" color="error">{errors.kategori}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="HM/KM Start"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.hmkm_start}
                  onChange={(e) => setField('hmkm_start', e.target.value)}
                  placeholder="0"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="HM/KM End"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.hmkm_end}
                  onChange={(e) => setField('hmkm_end', e.target.value)}
                  placeholder="0"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="SMU"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.smu}
                  onChange={(e) => setField('smu', e.target.value)}
                  placeholder="0"
                />
              </Grid>
            </Grid>
          </MainCard>

          <MainCard
            title="Permasalahan (Issue)"
            secondary={
              <Button variant="outlined" size="small" startIcon={<Add size={16} />} onClick={addItem}>
                Tambah Issue
              </Button>
            }
            sx={{ mb: 2 }}
          >
            {errors.items && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {errors.items}
              </Alert>
            )}
            <Stack spacing={2}>
              {form.items.map((item, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Issue #{index + 1}
                        {isEdit && item.kode_wo && (
                          <Chip label={item.kode_wo} size="small" color="info" variant="outlined" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removeItem(index)} disabled={form.items.length === 1}>
                        <Trash size={18} />
                      </IconButton>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={9}>
                        <TextField
                          label="Deskripsi Problem"
                          multiline
                          minRows={2}
                          size="small"
                          fullWidth
                          required
                          value={item.problem_issue}
                          onChange={(e) => updateItem(index, 'problem_issue', e.target.value)}
                          placeholder="Jelaskan kerusakan/issue..."
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status Item</InputLabel>
                          <Select label="Status Item" value={item.status} onChange={(e) => updateItem(index, 'status', e.target.value)}>
                            {ITEM_STATUS.map((opt) => (
                              <MenuItem key={opt.code} value={opt.code}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </MainCard>

          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="outlined" color="error" onClick={() => router.push('/daily-breakdown')} disabled={saving}>
              Batal
            </Button>
            <LoadingButton type="submit" variant="contained" loading={saving}>
              {isEdit ? 'Simpan Perubahan' : 'Simpan Breakdown'}
            </LoadingButton>
          </Stack>
        </form>
      )}
    </Box>
  );
}