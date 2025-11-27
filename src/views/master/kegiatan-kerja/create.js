'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography, TextField, MenuItem } from '@mui/material';

import { Activity, Send2, Category } from 'iconsax-react';
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
  message: 'Kegiatan Kerja berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Kegiatan Kerja', to: '/kegiatan-kerja' }, { title: 'Create' }];

const initialValues = {
  nama: '',
  grpequipment: 'HE',
  abbr: '',
  ctg: 'general-cost',
  subctg: 'pro',
  narasi: ''
};

export default function AddKegiatanKerjaScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    nama: Yup.string().required('Nama wajib diisi'),
    grpequipment: Yup.string().required('Grup Equipment wajib diisi')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/master/kegiatan-kerja/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT KEGIATAN KERJA ${values.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/kegiatan-kerja');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };



  return (
    <Fragment>
      <Breadcrumbs custom heading={'Add Kegiatan Kerja'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/kegiatan-kerja'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values }) => {
            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Nama Kegiatan"
                      type="text"
                      name="nama"
                      errors={errors.nama}
                      touched={touched.nama}
                      value={values.nama}
                      onChange={handleChange}
                      startAdornment={<Activity />}
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
                      label="Grup Equipment"
                      name="grpequipment"
                      value={values.grpequipment}
                      onChange={handleChange}
                      error={Boolean(touched.grpequipment && errors.grpequipment)}
                      helperText={touched.grpequipment && errors.grpequipment}
                    >
                      <MenuItem value="HE">HE (Heavy Equipment)</MenuItem>
                      <MenuItem value="DT">DT (Dump Truck)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mb: 4 }}>
                    <InputForm
                      label="Abbreviation"
                      type="text"
                      name="abbr"
                      errors={errors.abbr}
                      touched={touched.abbr}
                      value={values.abbr}
                      onChange={(e) => {
                        e.target.value = e.target.value.toLowerCase();
                        handleChange(e);
                      }}
                      startAdornment={<Activity />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mb: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Category"
                      name="ctg"
                      value={values.ctg}
                      onChange={handleChange}
                      error={Boolean(touched.ctg && errors.ctg)}
                      helperText={touched.ctg && errors.ctg}
                    >
                      <MenuItem value="general-cost">General Cost</MenuItem>
                      <MenuItem value="specific-cost">Specific Cost</MenuItem>
                      <MenuItem value="potential-income">Potential Income</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mb: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Sub Category"
                      name="subctg"
                      value={values.subctg}
                      onChange={handleChange}
                      error={Boolean(touched.subctg && errors.subctg)}
                      helperText={touched.subctg && errors.subctg}
                    >
                      <MenuItem value="pro">PRO (Productive)</MenuItem>
                      <MenuItem value="mhr">MHR (Mechanical Hour)</MenuItem>
                      <MenuItem value="unpro">UNPRO (Unproductive)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sx={{ mb: 4 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      label="Narasi"
                      name="narasi"
                      value={values.narasi}
                      onChange={handleChange}
                      error={Boolean(touched.narasi && errors.narasi)}
                      helperText={touched.narasi && errors.narasi}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <CardActions>
                      <Button component={Link} href="/kegiatan-kerja" variant="outlined" color="secondary">
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
