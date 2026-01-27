'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography, TextField, MenuItem } from '@mui/material';

import { Building3, Send2 } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import InputForm from 'components/InputForm';
import axiosServices from 'utils/axios';

import { openNotification } from 'api/notification';
import { saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Cabang berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Cabang', to: '/cabang' }, { title: 'Create' }];

const initialValues = {
  bisnis_id: '',
  area: '',
  kode: '',
  initial: '',
  nama: '',
  tipe: 'CABANG',
  email: '',
  phone: '',
  alamat: '',
  aktif: 'Y'
};

export default function AddCabangScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    bisnis_id: Yup.number().required('Bisnis Unit wajib diisi'),
    area: Yup.string().required('Area wajib diisi'),
    kode: Yup.string().required('Kode wajib diisi'),
    initial: Yup.string().required('Initial wajib diisi'),
    nama: Yup.string().required('Nama wajib diisi'),
    tipe: Yup.string().required('Tipe wajib diisi'),
    email: Yup.string().email('Email tidak valid')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/master/cabang/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT CABANG ${values.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/cabang');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Add Cabang'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/cabang'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => {
            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <OptionBisnisUnit
                      value={values.bisnis_id}
                      name={'bisnis_id'}
                      label="Bisnis Unit"
                      error={errors.bisnis_id}
                      touched={Boolean(true)}
                      startAdornment={<Building3 />}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Area"
                      type="text"
                      name="area"
                      errors={errors.area}
                      touched={touched.area}
                      value={values.area}
                      onChange={handleChange}
                      startAdornment={<Building3 />}
                    />
                    {Boolean(errors.area) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.area}
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
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Nama Cabang"
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
                    <TextField
                      select
                      fullWidth
                      label="Tipe"
                      name="tipe"
                      value={values.tipe}
                      onChange={handleChange}
                      error={Boolean(touched.tipe && errors.tipe)}
                      helperText={touched.tipe && errors.tipe}
                    >
                      <MenuItem value="PUSAT">PUSAT</MenuItem>
                      <MenuItem value="CABANG">CABANG</MenuItem>
                    </TextField>
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
                      <Button component={Link} href="/cabang" variant="outlined" color="secondary">
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
