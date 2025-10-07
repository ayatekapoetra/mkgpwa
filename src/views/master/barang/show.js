'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

// THIRD - PARTY
import { Building3, Send2, Trash } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionCabang from 'components/OptionCabang';
import InputForm from 'components/InputForm';
import axiosServices from 'utils/axios';

// HOOK
import { openNotification } from 'api/notification';
import { useShowBarang } from 'api/barang';
import { replayRequests, saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Barang berhasil diupdate...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Barang', to: '/barang' }, { title: 'Show' }];

export default function ShowBarangScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { data: initialValues, dataLoading } = useShowBarang(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const validationSchema = Yup.object({
    kode: Yup.string().required('Kode wajib diisi').max(50, 'Kode maksimal 50 karakter'),
    nama: Yup.string().required('Nama wajib diisi').max(250, 'Nama maksimal 250 karakter'),
    satuan: Yup.string().required('Satuan wajib diisi').max(50, 'Satuan maksimal 50 karakter'),
    bisnis_id: Yup.number().required('Bisnis Unit wajib diisi'),
    min_stok: Yup.number().min(0, 'Min stok minimal 0'),
    actual: Yup.number().min(0, 'Actual minimal 0')
  });

  useEffect(() => {
    const handleOnline = async () => {
      console.log('🔄 Koneksi kembali online → replay request offline...');
      await replayRequests();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/master/barang/${id}/update`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `UPDATE BARANG ${values.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/barang');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };

  const onDeleteHandle = async () => {
    const config = {
      url: `/api/master/barang/${id}/destroy`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `DELETE BARANG ${initialValues?.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/barang');
      openNotification({ ...msgSuccess, message: 'Barang berhasil dihapus...' });
    } catch (err) {
      console.error('Delete error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal menghapus data' });
    }
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Edit Barang'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/barang'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues || { kode: '', nama: '', satuan: '', bisnis_id: '', min_stok: 0, actual: 0 }} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => {
            console.log(errors);
            console.log('VALUES--', values);

            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <OptionCabang
                      value={values.bisnis_id}
                      name={'bisnis_id'}
                      label="Bisnis Unit"
                      error={errors.bisnis_id}
                      touched={Boolean(true)}
                      startAdornment={<Building3 />}
                      helperText={Boolean(true) && errors.bisnis_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Kode Barang"
                      type="text"
                      name="kode"
                      errors={errors.kode}
                      touched={touched.kode}
                      value={values.kode}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.kode) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.kode}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Nama Barang"
                      type="text"
                      name="nama"
                      errors={errors.nama}
                      touched={touched.nama}
                      value={values.nama}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.nama) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.nama}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Satuan"
                      type="text"
                      name="satuan"
                      errors={errors.satuan}
                      touched={touched.satuan}
                      value={values.satuan}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.satuan) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.satuan}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Min Stok"
                      type="number"
                      name="min_stok"
                      errors={errors.min_stok}
                      touched={touched.min_stok}
                      value={values.min_stok}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.min_stok) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.min_stok}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Actual"
                      type="number"
                      name="actual"
                      errors={errors.actual}
                      touched={touched.actual}
                      value={values.actual}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.actual) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.actual}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <CardActions>
                      <Button component={Link} href="/barang" variant="outlined" color="secondary">
                        Batal
                      </Button>
                      <Button onClick={() => setOpenDeleteDialog(true)} variant="outlined" color="error" startIcon={<Trash />}>
                        Hapus
                      </Button>
                      <Button type="submit" variant="contained" startIcon={<Send2 />}>
                        Update
                      </Button>
                    </CardActions>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </MainCard>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus Barang &quot;{initialValues?.nama}&quot;?</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="secondary">
            Batal
          </Button>
          <Button onClick={onDeleteHandle} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}