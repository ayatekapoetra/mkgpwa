'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography, TextField, MenuItem } from '@mui/material';

import { Building3, Send2, Category } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionCabang from 'components/OptionCabang';
import InputForm from 'components/InputForm';
import axiosServices from 'utils/axios';

import { openNotification } from 'api/notification';
import { saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Lokasi Kerja berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Lokasi Kerja', to: '/lokasi-kerja' }, { title: 'Create' }];

const initialValues = {
  nama: '',
  type: '',
  abbr: '',
  cabang_id: ''
};

export default function AddLokasiKerjaScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    nama: Yup.string().required('Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    type: Yup.string().required('Type wajib diisi'),
    abbr: Yup.string().max(30, 'Abbr maksimal 30 karakter'),
    cabang_id: Yup.number().required('Cabang wajib diisi')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/master/lokasi-kerja/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT LOKASI KERJA ${values.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/lokasi-kerja');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Add Lokasi Kerja'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/lokasi-kerja'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => {
            console.log(errors);
            console.log('VALUES--', values);

            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <OptionCabang
                      value={values.cabang_id}
                      name={'cabang_id'}
                      label="Nama Cabang"
                      error={errors.cabang_id}
                      touched={Boolean(true)}
                      startAdornment={<Building3 />}
                      helperText={Boolean(true) && errors.cabang_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                   <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                     <InputForm
                       label="Nama Lokasi Kerja"
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
                       label="Abbreviation"
                       type="text"
                       name="abbr"
                       errors={errors.abbr}
                       touched={touched.abbr}
                       value={values.abbr}
                       onChange={handleChange}
                       startAdornment={<Building3 />}
                       placeholder="Singkatan lokasi kerja"
                     />
                     {Boolean(errors.abbr) && (
                       <Typography variant="body2" color="error" gutterBottom>
                         {errors.abbr}
                       </Typography>
                     )}
                   </Grid>
                   <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                     <TextField
                       select
                       fullWidth
                       label="Type Lokasi"
                       name="type"
                       value={values.type}
                       onChange={handleChange}
                       error={Boolean(touched.type && errors.type)}
                       helperText={touched.type && errors.type}
                     >
                       <MenuItem value="PIT">PIT</MenuItem>
                       <MenuItem value="STP">STP</MenuItem>
                       <MenuItem value="OTH">OTH</MenuItem>
                     </TextField>
                   </Grid>
                  <Grid item xs={12}>
                    <CardActions>
                      <Button component={Link} href="/lokasi-kerja" variant="outlined" color="secondary">
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