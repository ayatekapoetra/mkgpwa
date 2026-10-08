'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import moment from 'moment';
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, InputAdornment, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Box1, Building, Calendar, MoneyRecive, Save2, Trash } from 'iconsax-react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { createHargaBeli, deactivateHargaBeli, updateHargaBeli, useHargaBeliAccess, useHargaBeliDetail, useHargaBeliOptions } from 'api/harga-beli';

const emptyValues = { barang_id: '', bisnis_id: '', bisnis_ids: [], gudang_id: '', gudang_ids: [], periode: moment().format('YYYY-MM'), harga_beli: '', narasi: '', aktif: 'Y' };
const schema = Yup.object({
  barang_id: Yup.number().typeError('Barang wajib dipilih').required('Barang wajib dipilih'),
  bisnis_id: Yup.number().when('$edit', {
    is: true,
    then: () => Yup.number().typeError('Bisnis wajib dipilih').required('Bisnis wajib dipilih'),
    otherwise: () => Yup.number().nullable()
  }),
  bisnis_ids: Yup.array().when('$edit', {
    is: false,
    then: () => Yup.array().min(1, 'Pilih minimal satu unit bisnis').required('Pilih minimal satu unit bisnis'),
    otherwise: () => Yup.array().nullable()
  }),
  gudang_id: Yup.number().when('$edit', {
    is: true,
    then: () => Yup.number().typeError('Gudang wajib dipilih').required('Gudang wajib dipilih'),
    otherwise: () => Yup.number().nullable()
  }),
  gudang_ids: Yup.array().nullable(),
  periode: Yup.string().matches(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format periode tidak valid').required('Periode wajib diisi'),
  harga_beli: Yup.number().typeError('Harga wajib berupa angka').min(0, 'Harga tidak boleh negatif').required('Harga beli wajib diisi'),
  narasi: Yup.string().max(500, 'Narasi maksimal 500 karakter')
});
const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 8 })}`;

function Section({ icon, title, subtitle, children }) {
  const theme = useTheme();
  return <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}><Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.045), borderBottom: '1px solid', borderColor: 'divider' }}><Box sx={{ width: 40, height: 40, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.13), color: 'primary.main' }}>{icon}</Box><Box><Typography variant="h6">{title}</Typography><Typography variant="caption" color="text.secondary">{subtitle}</Typography></Box></Stack><Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box></Paper>;
}

export default function HargaBeliForm({ edit = false }) {
  const { id } = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { options, loading: optionsLoading, error: optionsError } = useHargaBeliOptions();
  const { permissions, loading: accessLoading } = useHargaBeliAccess();
  const { data, loading: detailLoading, error: detailError } = useHargaBeliDetail(edit ? id : null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const allowed = edit ? permissions.can_update : permissions.can_insert;
  const initialValues = edit && data ? { ...emptyValues, barang_id: data.barang_id || '', bisnis_id: data.bisnis_id || '', gudang_id: data.gudang_id || '', periode: data.periode || '', harga_beli: data.harga_beli ?? '', narasi: data.narasi || '', aktif: data.aktif === 'N' ? 'N' : 'Y' } : emptyValues;

  const submit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...values,
        barang_id: Number(values.barang_id),
        harga_beli: Number(values.harga_beli),
        ...(edit
          ? {
              bisnis_id: Number(values.bisnis_id),
              gudang_id: Number(values.gudang_id)
            }
          : {
              bisnis_ids: (values.bisnis_ids || []).map((v) => Number(v)).filter(Boolean),
              gudang_ids: (values.gudang_ids || []).map((v) => Number(v)).filter(Boolean)
            })
      };
      if (edit) await updateHargaBeli(id, payload); else await createHargaBeli(payload);
      openNotification({ open: true, title: 'success', message: `Harga beli berhasil ${edit ? 'diperbarui' : 'ditambahkan'}`, alert: { color: 'success' } });
      router.push('/harga-beli');
    } catch (error) {
      openNotification({ open: true, title: 'error', message: error?.message || 'Gagal menyimpan harga beli', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async () => {
    try {
      await deactivateHargaBeli(id);
      openNotification({ open: true, title: 'success', message: 'Harga beli berhasil dinonaktifkan', alert: { color: 'success' } });
      router.push('/harga-beli');
    } catch (error) {
      openNotification({ open: true, title: 'error', message: error?.message || 'Gagal menonaktifkan harga beli', alert: { color: 'error' } });
    } finally {
      setDeleteOpen(false);
    }
  };

  if (accessLoading || optionsLoading || (edit && detailLoading)) return <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress /></Stack>;
  if (optionsError || (edit && detailError)) return <Alert severity="error">Data form harga beli gagal dimuat.</Alert>;
  if (!allowed) return <Alert severity="warning">Anda tidak memiliki akses untuk {edit ? 'mengubah' : 'menambahkan'} harga beli.</Alert>;

  return <Fragment><Breadcrumbs custom heading={edit ? 'Edit Harga Beli' : 'Tambah Harga Beli'} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Harga Beli', to: '/harga-beli' }, { title: edit ? 'Edit' : 'Tambah' }]} /><MainCard title={<BtnBack href="/harga-beli" />} content>
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, borderColor: alpha(theme.palette.primary.main, 0.2), background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${theme.palette.background.paper} 70%)` }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h4" fontWeight={800}>{edit ? 'Perbarui Harga Beli' : 'Harga Beli Baru'}</Typography><Typography color="text.secondary">Harga berlaku per barang, bisnis, gudang, dan periode bulanan.</Typography></Box><Stack direction="row" spacing={1}><Chip label="IDR" color="primary" variant="outlined" /><Chip label="Histori Bulanan" color="info" variant="outlined" /></Stack></Stack></Paper>
    <Formik initialValues={initialValues} enableReinitialize validationSchema={schema} validate={(values) => {
      try {
        schema.validateSync(values, { abortEarly: false, context: { edit } });
        return {};
      } catch (validationErrors) {
        const result = {};
        if (Array.isArray(validationErrors?.inner)) {
          for (const err of validationErrors.inner) {
            if (err.path && !result[err.path]) result[err.path] = err.message;
          }
        }
        return result;
      }
    }} onSubmit={submit}>{({ errors, handleBlur, handleChange, isSubmitting, setFieldTouched, setFieldValue, touched, values }) => {
      const selected = (rows, value) => rows.find((row) => String(row.id) === String(value)) || null;
      const barangOptions = [...(options.barangs || [])];
      if (edit && data?.barang_id && !selected(barangOptions, data.barang_id)) {
        barangOptions.unshift({
          id: data.barang_id,
          kode: data.barang_kode,
          nama: data.barang_nama,
          num_part: data.barang_num_part,
          satuan: data.satuan,
          stn_pakai: data.stn_pakai,
          pembagi_pakai: data.barang_pembagi_pakai
        });
      }
      const bisnisOptions = [...(options.bisnis || [])];
      if (edit && data?.bisnis_id && !selected(bisnisOptions, data.bisnis_id)) {
        bisnisOptions.unshift({
          id: data.bisnis_id,
          initial: data.bisnis_initial,
          name: data.bisnis_nama || data.bisnis_initial || 'Bisnis Terpilih'
        });
      }
      const gudangPool = [...(options.gudangs || [])];
      if (edit && data?.gudang_id && !selected(gudangPool, data.gudang_id)) {
        gudangPool.unshift({
          id: data.gudang_id,
          bisnis_id: data.bisnis_id,
          kode: data.gudang_kode,
          nama: data.gudang_nama || data.gudang_kode || 'Gudang Terpilih'
        });
      }
      const barang = selected(barangOptions, values.barang_id);
      const selectedBisnis = bisnisOptions.filter((row) => (values.bisnis_ids || []).map(String).includes(String(row.id)));
      const activeBisnisIds = edit
        ? (values.bisnis_id ? [String(values.bisnis_id)] : [])
        : (values.bisnis_ids || []).map(String);
      const gudangs = gudangPool.filter((row) => !activeBisnisIds.length || activeBisnisIds.includes(String(row.bisnis_id)));
      const selectedGudangs = gudangs.filter((row) => (values.gudang_ids || []).map(String).includes(String(row.id)));
      const pembagi = Number(barang?.pembagi_pakai || 1) > 0 ? Number(barang?.pembagi_pakai || 1) : 1;
      const hargaPakai = Number(values.harga_beli || 0) / pembagi;
      const historyRows = Array.isArray(data?.history) ? data.history : [];
      return <Form noValidate><Stack spacing={3}>
        <Section icon={<Box1 size={21} />} title="Barang & Lokasi" subtitle="Pilih barang dan scope lokasi harga."><Grid container spacing={2.5}>
          <Grid item xs={12}><Autocomplete options={barangOptions} value={barang} getOptionLabel={(row) => `${row.kode || '-'} - ${row.nama || '-'}`} isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)} onChange={(_, row) => setFieldValue('barang_id', row?.id || '')} onBlur={() => setFieldTouched('barang_id', true)} renderInput={(params) => <TextField {...params} required label="Barang" error={touched.barang_id && Boolean(errors.barang_id)} helperText={(touched.barang_id && errors.barang_id) || (barang?.num_part ? `Part number: ${barang.num_part}` : 'Pilih barang master')} />} /></Grid>
          <Grid item xs={12} md={6}>
            {edit ? (
              <Autocomplete options={bisnisOptions} value={selected(bisnisOptions, values.bisnis_id)} getOptionLabel={(row) => `${row.initial || '-'} - ${row.name || '-'}`} isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)} onChange={(_, row) => { setFieldValue('bisnis_id', row?.id || ''); setFieldValue('gudang_id', ''); }} onBlur={() => setFieldTouched('bisnis_id', true)} renderInput={(params) => <TextField {...params} required label="Bisnis" error={touched.bisnis_id && Boolean(errors.bisnis_id)} helperText={(touched.bisnis_id && errors.bisnis_id) || 'Scope kepemilikan harga'} />} />
            ) : (
              <Stack spacing={1}>
                <Autocomplete
                  multiple
                  options={bisnisOptions}
                  value={selectedBisnis}
                  getOptionLabel={(row) => `${row.initial || '-'} - ${row.name || '-'}`}
                  isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                  onChange={(_, rows) => {
                    const nextBisnisIds = (rows || []).map((row) => row.id);
                    setFieldValue('bisnis_ids', nextBisnisIds);
                    const allowedGudangs = gudangPool.filter((g) => nextBisnisIds.map(String).includes(String(g.bisnis_id)));
                    setFieldValue('gudang_ids', (values.gudang_ids || []).filter((gid) => allowedGudangs.some((ag) => String(ag.id) === String(gid))));
                  }}
                  onBlur={() => setFieldTouched('bisnis_ids', true)}
                  renderTags={(tagValue, getTagProps) => tagValue.map((option, index) => <Chip key={option.id} size="small" label={option.initial || option.name} {...getTagProps({ index })} />)}
                  renderInput={(params) => <TextField {...params} required label="Unit Bisnis (Bisa Lebih dari Satu)" error={touched.bisnis_ids && Boolean(errors.bisnis_ids)} helperText={(touched.bisnis_ids && errors.bisnis_ids) || `${selectedBisnis.length} unit bisnis dipilih`} />}
                />
                {bisnisOptions.length > 1 ? (
                  <Button size="small" variant="text" sx={{ alignSelf: 'flex-start', p: 0 }} onClick={() => {
                    const nextBisnisIds = selectedBisnis.length === bisnisOptions.length ? [] : bisnisOptions.map((b) => b.id);
                    setFieldValue('bisnis_ids', nextBisnisIds);
                    if (!nextBisnisIds.length) setFieldValue('gudang_ids', []);
                  }}>
                    {selectedBisnis.length === bisnisOptions.length ? 'Batalkan Pilih Semua Bisnis' : 'Pilih Semua Unit Bisnis'}
                  </Button>
                ) : null}
              </Stack>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {edit ? (
              <Autocomplete options={gudangs} value={selected(gudangs, values.gudang_id)} getOptionLabel={(row) => `${row.kode || '-'} - ${row.nama || '-'}`} isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)} onChange={(_, row) => setFieldValue('gudang_id', row?.id || '')} onBlur={() => setFieldTouched('gudang_id', true)} renderInput={(params) => <TextField {...params} required label="Gudang" error={touched.gudang_id && Boolean(errors.gudang_id)} helperText={(touched.gudang_id && errors.gudang_id) || (values.bisnis_id ? 'Gudang pada bisnis terpilih' : 'Pilih bisnis terlebih dahulu')} />} />
            ) : (
              <Stack spacing={1}>
                <Autocomplete
                  multiple
                  options={gudangs}
                  value={selectedGudangs}
                  getOptionLabel={(row) => `${row.kode || '-'} - ${row.nama || '-'}`}
                  isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                  onChange={(_, rows) => setFieldValue('gudang_ids', (rows || []).map((row) => row.id))}
                  onBlur={() => setFieldTouched('gudang_ids', true)}
                  renderTags={(tagValue, getTagProps) => tagValue.map((option, index) => <Chip key={option.id} size="small" label={option.kode || option.nama} {...getTagProps({ index })} />)}
                  renderInput={(params) => <TextField {...params} label="Gudang (Opsional / Multi)" error={touched.gudang_ids && Boolean(errors.gudang_ids)} helperText={(touched.gudang_ids && errors.gudang_ids) || (activeBisnisIds.length ? (selectedGudangs.length ? `${selectedGudangs.length} gudang dipilih` : 'Kosongkan untuk otomatis mencakup seluruh gudang pada bisnis terpilih') : 'Pilih unit bisnis terlebih dahulu')} />}
                />
                {activeBisnisIds.length && gudangs.length > 1 ? (
                  <Button size="small" variant="text" sx={{ alignSelf: 'flex-start', p: 0 }} onClick={() => setFieldValue('gudang_ids', selectedGudangs.length === gudangs.length ? [] : gudangs.map((g) => g.id))}>
                    {selectedGudangs.length === gudangs.length ? 'Batalkan Pilih Semua Gudang' : 'Pilih Semua Gudang Terkait'}
                  </Button>
                ) : null}
              </Stack>
            )}
          </Grid>
        </Grid></Section>
        <Section icon={<MoneyRecive size={21} />} title="Harga & Periode" subtitle="Harga pakai dihitung otomatis dari pembagi pada master barang."><Grid container spacing={2.5}>
          <Grid item xs={12} md={4}><TextField fullWidth required type="month" name="periode" label="Periode" value={values.periode} onChange={handleChange} onBlur={handleBlur} error={touched.periode && Boolean(errors.periode)} helperText={(touched.periode && errors.periode) || 'Bulan berlakunya harga'} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment> }} /></Grid>
          <Grid item xs={12} md={8}><TextField fullWidth required type="number" name="harga_beli" label="Harga Beli per Satuan Order" value={values.harga_beli} onChange={handleChange} onBlur={handleBlur} error={touched.harga_beli && Boolean(errors.harga_beli)} helperText={(touched.harga_beli && errors.harga_beli) || `Satuan order: ${barang?.satuan || '-'}`} inputProps={{ min: 0, step: 'any' }} InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }} /></Grid>
          <Grid item xs={12}><Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderColor: alpha(theme.palette.success.main, 0.2) }}><Grid container spacing={2}><Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Satuan Order</Typography><Typography fontWeight={700}>{barang?.satuan || '-'}</Typography></Grid><Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Satuan Pakai</Typography><Typography fontWeight={700}>{barang?.stn_pakai || barang?.satuan || '-'}</Typography></Grid><Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Pembagi Pakai</Typography><Typography fontWeight={700}>{pembagi}</Typography></Grid><Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Harga Pakai</Typography><Typography fontWeight={800} color="success.main">{formatCurrency(hargaPakai)}</Typography></Grid></Grid></Paper></Grid>
        </Grid></Section>
        <Section icon={<Building size={21} />} title="Informasi Tambahan" subtitle="Tambahkan konteks agar perubahan harga mudah ditelusuri."><Grid container spacing={2.5}><Grid item xs={12}><TextField fullWidth multiline minRows={3} name="narasi" label="Narasi / Catatan" value={values.narasi} onChange={handleChange} onBlur={handleBlur} error={touched.narasi && Boolean(errors.narasi)} helperText={(touched.narasi && errors.narasi) || 'Contoh: penyesuaian harga berdasarkan pembelian terakhir'} /></Grid><Grid item xs={12}><FormControlLabel control={<Switch checked={values.aktif === 'Y'} onChange={(event) => setFieldValue('aktif', event.target.checked ? 'Y' : 'N')} />} label={values.aktif === 'Y' ? 'Harga aktif dan dapat digunakan' : 'Harga tidak aktif'} /></Grid></Grid></Section>
        {edit && historyRows.length ? (
          <Section icon={<Calendar size={21} />} title="Riwayat Periode Harga" subtitle="Perbandingan harga pada kombinasi barang, bisnis, dan gudang ini.">
            <Box sx={{ overflowX: 'auto' }}>
              <Paper variant="outlined">
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { p: 1.5, borderBottom: '1px solid', borderColor: 'divider', fontSize: 13 } }}>
                  <Box component="thead" sx={{ bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.04) }}>
                    <Box component="tr">
                      <Box component="th" sx={{ textAlign: 'left' }}>Periode</Box>
                      <Box component="th" sx={{ textAlign: 'right' }}>Harga Order</Box>
                      <Box component="th" sx={{ textAlign: 'right' }}>Harga Pakai</Box>
                      <Box component="th" sx={{ textAlign: 'left' }}>Status</Box>
                      <Box component="th" sx={{ textAlign: 'left' }}>Catatan</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {historyRows.map((item) => (
                      <Box component="tr" key={item.id} sx={{ bgcolor: String(item.id) === String(id) ? alpha(theme.palette.primary.main, 0.08) : 'transparent' }}>
                        <Box component="td" sx={{ fontWeight: String(item.id) === String(id) ? 700 : 500 }}>{item.periode} {String(item.id) === String(id) ? '(sedang diedit)' : ''}</Box>
                        <Box component="td" sx={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.harga_beli)} /{item.satuan || '-'}</Box>
                        <Box component="td" sx={{ textAlign: 'right' }}>{formatCurrency(item.harga_pakai)} /{item.stn_pakai || '-'}</Box>
                        <Box component="td"><Chip size="small" label={item.aktif === 'Y' ? 'Aktif' : 'Tidak Aktif'} color={item.aktif === 'Y' ? 'success' : 'default'} /></Box>
                        <Box component="td" sx={{ color: 'text.secondary' }}>{item.narasi || '-'}</Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Section>
        ) : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1}>{edit && permissions.can_remove && data?.aktif === 'Y' ? <Button color="error" variant="outlined" startIcon={<Trash size={18} />} onClick={() => setDeleteOpen(true)}>Nonaktifkan</Button> : null}<Button component={Link} href="/harga-beli" color="secondary" variant="outlined">Batal</Button><Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={17} color="inherit" /> : <Save2 size={18} />}>{isSubmitting ? 'Menyimpan...' : edit ? 'Simpan Perubahan' : 'Simpan Harga'}</Button></Stack>
      </Stack></Form>;
    }}</Formik>
  </MainCard><Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth><DialogTitle>Nonaktifkan Harga Beli?</DialogTitle><DialogContent><Typography>Record tidak dihapus agar histori transaksi tetap aman, tetapi tidak lagi dapat dipilih untuk transaksi baru.</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteOpen(false)}>Batal</Button><Button color="error" variant="contained" onClick={deactivate}>Nonaktifkan</Button></DialogActions></Dialog></Fragment>;
}
