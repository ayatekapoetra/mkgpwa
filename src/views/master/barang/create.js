'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CardActions,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Barcode, Box1, Category2, Gallery, Send2, Setting2, Trash } from 'iconsax-react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import axiosServices from 'utils/axios';
import { openNotification } from 'api/notification';
import { useBarangFilterOptions, useShowBarang } from 'api/barang';
import { saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Barang berhasil dibuat',
  alert: { color: 'success' }
};

const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Barang', to: '/barang' }, { title: 'Tambah' }];

const initialValues = {
  kode: '',
  nama: '',
  num_part: '',
  serial: '',
  kategori_id: '',
  application_id: '',
  manufacture_id: '',
  brand_id: '',
  satuan: '',
  stn_pakai: '',
  pembagi_pakai: 1,
  min_stok: 0,
  tracking: 'N',
  photo: ''
};

const validationSchema = Yup.object({
  kode: Yup.string().trim().required('Kode barang wajib diisi').max(50, 'Maksimal 50 karakter'),
  nama: Yup.string().trim().required('Nama barang wajib diisi').max(250, 'Maksimal 250 karakter'),
  num_part: Yup.string().trim().max(100, 'Maksimal 100 karakter'),
  serial: Yup.string().trim().max(100, 'Maksimal 100 karakter'),
  satuan: Yup.string().trim().required('Satuan order wajib diisi').max(50, 'Maksimal 50 karakter'),
  stn_pakai: Yup.string().trim().required('Satuan pakai wajib diisi').max(50, 'Maksimal 50 karakter'),
  pembagi_pakai: Yup.number().typeError('Pembagi harus berupa angka').moreThan(0, 'Pembagi harus lebih dari 0').required('Pembagi wajib diisi'),
  min_stok: Yup.number().typeError('Minimum stok harus berupa angka').min(0, 'Minimum stok tidak boleh negatif').required('Minimum stok wajib diisi'),
  tracking: Yup.string().oneOf(['Y', 'N']),
  photo: Yup.string().trim().max(500, 'Maksimal 500 karakter')
});

const nullableText = (value) => value?.trim() || null;
const nullableId = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

function SectionCard({ title, subtitle, icon, children }) {
  const theme = useTheme();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden', borderColor: alpha(theme.palette.divider, 0.9) }}>
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.045),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: 1.75,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main'
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box>
    </Paper>
  );
}

function RelationField({ label, name, options, value, loading, setFieldValue, setFieldTouched, error, touched }) {
  const selected = options.find((option) => String(option.id) === String(value)) || null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      loading={loading}
      getOptionLabel={(option) => option.label || option.name || ''}
      isOptionEqualToValue={(option, current) => String(option.id) === String(current?.id)}
      onChange={(_, option) => setFieldValue(name, option?.id || '')}
      onBlur={() => setFieldTouched(name, true)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={touched && Boolean(error)}
          helperText={(touched && error) || 'Opsional'}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
}

function UnitField({ label, name, options, value, setFieldValue, setFieldTouched, error, touched, helperText }) {
  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value || ''}
      onChange={(_, option) => setFieldValue(name, option || '')}
      onInputChange={(_, input, reason) => {
        if (reason === 'input' || reason === 'clear') setFieldValue(name, input);
      }}
      onBlur={() => setFieldTouched(name, true)}
      renderInput={(params) => (
        <TextField {...params} label={label} error={touched && Boolean(error)} helperText={(touched && error) || helperText} />
      )}
    />
  );
}

export default function AddBarangScreen({ edit = false }) {
  const route = useRouter();
  const { id } = useParams();
  const theme = useTheme();
  const { options, optionsLoading, optionsError } = useBarangFilterOptions();
  const { data: barang, dataLoading, dataError } = useShowBarang(edit ? id : null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    const payload = {
      kode: values.kode.trim(),
      nama: values.nama.trim(),
      num_part: nullableText(values.num_part),
      serial: nullableText(values.serial),
      kategori_id: nullableId(values.kategori_id),
      application_id: nullableId(values.application_id),
      manufacture_id: nullableId(values.manufacture_id),
      brand_id: nullableId(values.brand_id),
      satuan: values.satuan.trim(),
      stn_pakai: values.stn_pakai.trim(),
      pembagi_pakai: Number(values.pembagi_pakai),
      min_stok: Number(values.min_stok),
      tracking: values.tracking,
      photo: nullableText(values.photo)
    };

    const config = {
      url: edit ? `/api/master/barang/${id}/update` : '/api/master/barang/create',
      method: 'POST',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `${edit ? 'UPDATE' : 'INSERT'} BARANG ${payload.nama}`
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await saveRequest(config);
        openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
        return;
      }

      await axiosServices(config);
      openNotification({ ...msgSuccess, message: `Barang berhasil ${edit ? 'diperbarui' : 'dibuat'}` });
      route.push('/barang');
    } catch (error) {
      openNotification({ ...msgError, message: error?.message || error?.diagnostic?.error || 'Gagal menyimpan barang' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const config = {
      url: `/api/master/barang/${id}/destroy`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `DELETE BARANG ${barang?.nama || ''}`
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await saveRequest(config);
        openNotification({ ...msgError, message: 'Offline: penghapusan disimpan ke antrian' });
        return;
      }

      await axiosServices(config);
      openNotification({ ...msgSuccess, message: 'Barang berhasil dihapus' });
      route.push('/barang');
    } catch (error) {
      openNotification({ ...msgError, message: error?.message || error?.diagnostic?.error || 'Gagal menghapus barang' });
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  const unitOptions = [...new Set((options.satuans || []).map((option) => option.value).filter(Boolean))];
  const usageUnitOptions = [
    ...new Set([...(options.stnPakais || []).map((option) => option.value), ...unitOptions].filter(Boolean))
  ];

  const formValues = edit && barang
    ? {
        ...initialValues,
        kode: barang.kode || '',
        nama: barang.nama || '',
        num_part: barang.num_part || '',
        serial: barang.serial || '',
        kategori_id: barang.kategori_id || '',
        application_id: barang.application_id || '',
        manufacture_id: barang.manufacture_id || '',
        brand_id: barang.brand_id || '',
        satuan: barang.satuan || '',
        stn_pakai: barang.stn_pakai || barang.satuan || '',
        pembagi_pakai: barang.pembagi_pakai ?? 1,
        min_stok: barang.min_stok ?? 0,
        tracking: barang.tracking === 'Y' ? 'Y' : 'N',
        photo: barang.photo || ''
      }
    : initialValues;

  if (edit && dataLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 280 }} spacing={1.5}>
        <CircularProgress />
        <Typography color="text.secondary">Memuat data barang...</Typography>
      </Stack>
    );
  }

  if (edit && dataError) return <Alert severity="error">Data barang gagal dimuat.</Alert>;

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={edit ? 'Edit Barang' : 'Tambah Barang'}
        links={edit ? [...breadcrumbLinks.slice(0, 2), { title: 'Edit' }] : breadcrumbLinks}
      />
      <MainCard title={<BtnBack href="/barang" />} content>
        <Stack spacing={3}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 2.5,
              borderColor: alpha(theme.palette.primary.main, 0.18),
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.11)} 0%, ${alpha(
                theme.palette.info.main,
                0.04
              )} 55%, ${theme.palette.background.paper} 100%)`
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <Box1 size={26} />
                </Box>
                <Box>
                  <Typography variant="h5">{edit ? 'Perbarui Master Barang' : 'Master Barang Baru'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {edit ? 'Periksa dan perbarui informasi barang yang tersimpan.' : 'Lengkapi identitas, klasifikasi, dan konfigurasi satuan barang.'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" color="primary" variant="outlined" label="Master Global" />
                <Chip size="small" color="success" variant="outlined" label="Aktif saat dibuat" />
              </Stack>
            </Stack>
          </Paper>

          {optionsError ? <Alert severity="warning">Opsi klasifikasi gagal dimuat. Form tetap dapat diisi dan dicoba kembali.</Alert> : null}

          <Formik initialValues={formValues} enableReinitialize validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ errors, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldTouched, setFieldValue, touched, values }) => (
              <Form noValidate onSubmit={submitForm}>
                <Stack spacing={3}>
                  <SectionCard title="Identitas Barang" subtitle="Informasi utama untuk pencarian dan pengenalan barang." icon={<Barcode size={22} />}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          autoFocus
                          required
                          name="kode"
                          label="Kode Barang"
                          value={values.kode}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.kode && Boolean(errors.kode)}
                          helperText={(touched.kode && errors.kode) || 'Kode unik internal, maksimal 50 karakter'}
                          InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          required
                          name="nama"
                          label="Nama Barang"
                          value={values.nama}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.nama && Boolean(errors.nama)}
                          helperText={(touched.nama && errors.nama) || 'Gunakan nama yang mudah dikenali pada transaksi dan laporan'}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          name="num_part"
                          label="Part Number"
                          value={values.num_part}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.num_part && Boolean(errors.num_part)}
                          helperText={(touched.num_part && errors.num_part) || 'Nomor part dari produsen, jika tersedia'}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          name="serial"
                          label="Serial / Model Number"
                          value={values.serial}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.serial && Boolean(errors.serial)}
                          helperText={(touched.serial && errors.serial) || 'Identitas tambahan barang, jika tersedia'}
                        />
                      </Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard title="Klasifikasi" subtitle="Kelompokkan barang agar mudah difilter dan digunakan pada proses operasional." icon={<Category2 size={22} />}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <RelationField label="Kategori" name="kategori_id" options={options.categories || []} value={values.kategori_id} loading={optionsLoading} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} error={errors.kategori_id} touched={touched.kategori_id} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <RelationField label="Application" name="application_id" options={options.applications || []} value={values.application_id} loading={optionsLoading} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} error={errors.application_id} touched={touched.application_id} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <RelationField label="Manufaktur" name="manufacture_id" options={options.manufactures || []} value={values.manufacture_id} loading={optionsLoading} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} error={errors.manufacture_id} touched={touched.manufacture_id} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <RelationField label="Brand" name="brand_id" options={options.brands || []} value={values.brand_id} loading={optionsLoading} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} error={errors.brand_id} touched={touched.brand_id} />
                      </Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard title="Satuan & Konversi" subtitle="Atur hubungan antara satuan order dan satuan yang dipakai di lapangan." icon={<Setting2 size={22} />}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={4}>
                        <UnitField label="Satuan Order" name="satuan" options={unitOptions} value={values.satuan} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} error={errors.satuan} touched={touched.satuan} helperText="Pilih atau ketik satuan baru, contoh BOX" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <UnitField label="Satuan Pakai" name="stn_pakai" options={usageUnitOptions} value={values.stn_pakai} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} error={errors.stn_pakai} touched={touched.stn_pakai} helperText="Pilih atau ketik satuan pemakaian, contoh PCS" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          type="number"
                          name="pembagi_pakai"
                          label="Pembagi Pakai"
                          value={values.pembagi_pakai}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.pembagi_pakai && Boolean(errors.pembagi_pakai)}
                          helperText={(touched.pembagi_pakai && errors.pembagi_pakai) || 'Contoh: 1 BOX = 10 PCS, isi 10'}
                          inputProps={{ min: 0.000001, step: 'any' }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="info" variant="outlined">
                          Jika satuan order dan satuan pakai sama, gunakan pembagi <strong>1</strong>.
                        </Alert>
                      </Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard title="Kontrol Persediaan" subtitle="Konfigurasi minimum stok, tracking, dan referensi foto barang." icon={<Gallery size={22} />}>
                    <Grid container spacing={2.5} alignItems="stretch">
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          type="number"
                          name="min_stok"
                          label="Minimum Stok"
                          value={values.min_stok}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.min_stok && Boolean(errors.min_stok)}
                          helperText={(touched.min_stok && errors.min_stok) || `Dalam satuan order (${values.satuan || '-'})`}
                          inputProps={{ min: 0, step: 'any' }}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          name="photo"
                          label="URL / Path Foto"
                          value={values.photo}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.photo && Boolean(errors.photo)}
                          helperText={(touched.photo && errors.photo) || 'Opsional, masukkan lokasi foto yang sudah tersimpan'}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.035) }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>Tracking HM/KM</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Aktifkan jika pemakaian barang wajib mencatat hour meter atau kilometer unit.
                              </Typography>
                            </Box>
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={<Switch checked={values.tracking === 'Y'} onChange={(event) => setFieldValue('tracking', event.target.checked ? 'Y' : 'N')} />}
                              label={values.tracking === 'Y' ? 'Aktif' : 'Tidak aktif'}
                            />
                          </Stack>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="success" variant="outlined">
                          Stok aktual tidak diinput di master barang. Nilainya dihitung otomatis dari transaksi stok pada rack gudang.
                        </Alert>
                      </Grid>
                    </Grid>
                  </SectionCard>

                  <CardActions sx={{ px: 0, pt: 1, justifyContent: 'flex-end', gap: 1 }}>
                    <Button component={Link} href="/barang" variant="outlined" color="secondary" disabled={isSubmitting}>
                      Batal
                    </Button>
                    {edit ? (
                      <Button variant="outlined" color="error" startIcon={<Trash size={18} />} onClick={() => setOpenDeleteDialog(true)} disabled={isSubmitting}>
                        Hapus
                      </Button>
                    ) : null}
                    <Button type="submit" variant="contained" startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Send2 size={18} />} disabled={isSubmitting}>
                      {isSubmitting ? 'Menyimpan...' : edit ? 'Perbarui Barang' : 'Simpan Barang'}
                    </Button>
                  </CardActions>
                </Stack>
              </Form>
            )}
          </Formik>
        </Stack>
      </MainCard>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Barang?</DialogTitle>
        <DialogContent>
          <Typography>
            Barang <strong>{barang?.nama}</strong> akan dinonaktifkan dan tidak lagi tampil pada daftar aktif.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setOpenDeleteDialog(false)}>
            Batal
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} startIcon={<Trash size={18} />}>
            Hapus Barang
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
