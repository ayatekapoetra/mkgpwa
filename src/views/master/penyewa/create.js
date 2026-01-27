'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography } from '@mui/material';

import { Building3, Send2, Code, User } from 'iconsax-react';
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
  message: 'Penyewa berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Penyewa', to: '/penyewa' }, { title: 'Create' }];

const initialValues = {
  bisnis_id: '',
  kode: '',
  abbr: '',
  nama: ''
};

export default function AddPenyewaScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    bisnis_id: Yup.number().required('Bisnis Unit wajib diisi'),
    kode: Yup.string().required('Kode wajib diisi'),
    abbr: Yup.string().required('Abbr wajib diisi'),
    nama: Yup.string().required('Nama wajib diisi')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/master/penyewa/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT PENYEWA ${values.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/penyewa');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Add Penyewa'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/penyewa'} />} secondary={null} content={true}>
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
                      label="Kode"
                      type="text"
                      name="kode"
                      errors={errors.kode}
                      touched={touched.kode}
                      value={values.kode}
                      onChange={handleChange}
                      startAdornment={<Code />}
                    />
                    {Boolean(errors.kode) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.kode}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Abbr"
                      type="text"
                      name="abbr"
                      errors={errors.abbr}
                      touched={touched.abbr}
                      value={values.abbr}
                      onChange={handleChange}
                      startAdornment={<Code />}
                    />
                    {Boolean(errors.abbr) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.abbr}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Nama Penyewa"
                      type="text"
                      name="nama"
                      errors={errors.nama}
                      touched={touched.nama}
                      value={values.nama}
                      onChange={handleChange}
                      startAdornment={<User />}
                    />
                    {Boolean(errors.nama) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.nama}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <CardActions>
                      <Button component={Link} href="/penyewa" variant="outlined" color="secondary">
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
