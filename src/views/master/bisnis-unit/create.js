'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography, TextField } from '@mui/material';

import { Building3, Send2 } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import InputForm from 'components/InputForm';
import axiosServices from 'utils/axios';

import { openNotification } from 'api/notification';
import { saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Bisnis Unit berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Bisnis Unit', to: '/bisnis-unit' }, { title: 'Create' }];

const initialValues = {
  initial: '',
  kode: '',
  name: '',
  email: '',
  phone: '',
  alamat: '',
  kota: '',
  npwp: '',
  aktif: 'Y'
};

export default function AddBisnisUnitScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    initial: Yup.string().required('Initial wajib diisi').max(4, 'Initial maksimal 4 karakter'),
    kode: Yup.string().required('Kode wajib diisi').max(2, 'Kode maksimal 2 karakter'),
    name: Yup.string().required('Nama wajib diisi').max(50, 'Nama maksimal 50 karakter'),
    email: Yup.string().email('Email tidak valid')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/master/bisnis-unit/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT BISNIS UNIT ${values.name}`
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

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Add Bisnis Unit'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/bisnis-unit'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
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
                      <Button type="submit" variant="contained" startIcon={<Send2 />}>
                        Simpan
                      </Button>
                    </CardActions>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
