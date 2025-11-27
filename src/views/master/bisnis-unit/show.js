'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

import { Building3, Send2, Trash } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import InputForm from 'components/InputForm';
import axiosServices from 'utils/axios';

import { openNotification } from 'api/notification';
import { useShowBisnisUnit } from 'api/bisnis-unit';
import { replayRequests, saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Bisnis Unit berhasil diupdate...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Bisnis Unit', to: '/bisnis-unit' }, { title: 'Show' }];

export default function ShowBisnisUnitScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { bisnisUnit: initialValues, bisnisUnitLoading: dataLoading } = useShowBisnisUnit(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  console.log('Show BisnisUnit - id:', id);
  console.log('Show BisnisUnit - initialValues:', initialValues);
  console.log('Show BisnisUnit - dataLoading:', dataLoading);

  const validationSchema = Yup.object({
    initial: Yup.string().required('Initial wajib diisi').max(4, 'Initial maksimal 4 karakter'),
    kode: Yup.string().required('Kode wajib diisi').max(2, 'Kode maksimal 2 karakter'),
    name: Yup.string().required('Nama wajib diisi').max(50, 'Nama maksimal 50 karakter'),
    email: Yup.string().email('Email tidak valid')
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
      url: `/api/master/bisnis-unit/${id}/update`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `UPDATE BISNIS UNIT ${values.name}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/bisnis-unit');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };

  const onDeleteHandle = async () => {
    const config = {
      url: `/api/master/bisnis-unit/${id}/destroy`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `DELETE BISNIS UNIT ${initialValues?.name}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/bisnis-unit');
      openNotification({ ...msgSuccess, message: 'Bisnis Unit berhasil dihapus...' });
    } catch (err) {
      console.error('Delete error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal menghapus data' });
    }
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Edit Bisnis Unit'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/bisnis-unit'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues || { initial: '', kode: '', name: '', email: '', phone: '', alamat: '', kota: '', npwp: '', aktif: 'Y' }} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values }) => {
            console.log(errors);
            console.log('VALUES--', values);

            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={3} sx={{ mb: 4 }}>
                    <InputForm
                      label="Initial"
                      type="text"
                      name="initial"
                      errors={errors.initial}
                      touched={touched.initial}
                      value={values.initial}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.initial) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.initial}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={3} sx={{ mb: 4 }}>
                    <InputForm
                      label="Kode"
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
                      label="Nama"
                      type="text"
                      name="name"
                      errors={errors.name}
                      touched={touched.name}
                      value={values.name}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.name) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.name}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Email"
                      type="email"
                      name="email"
                      errors={errors.email}
                      touched={touched.email}
                      value={values.email}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.email) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.email}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Phone"
                      type="text"
                      name="phone"
                      errors={errors.phone}
                      touched={touched.phone}
                      value={values.phone}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Kota"
                      type="text"
                      name="kota"
                      errors={errors.kota}
                      touched={touched.kota}
                      value={values.kota}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="NPWP"
                      type="text"
                      name="npwp"
                      errors={errors.npwp}
                      touched={touched.npwp}
                      value={values.npwp}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mb: 4 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Alamat"
                      name="alamat"
                      value={values.alamat || ''}
                      onChange={handleChange}
                      error={Boolean(touched.alamat && errors.alamat)}
                      helperText={touched.alamat && errors.alamat}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <CardActions>
                      <Button component={Link} href="/bisnis-unit" variant="outlined" color="secondary">
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

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus Bisnis Unit &quot;{initialValues?.name}&quot;?</Typography>
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
