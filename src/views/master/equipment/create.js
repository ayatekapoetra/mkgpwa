'use client';

import { Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography } from '@mui/material';

// THIRD - PARTY
import { Building3, Weight, Send2, Code, Code1, UserTag, Award, Barcode } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup'; // ⬅ WAJIB
// import moment from 'moment';

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
import OptionSysOption from 'components/OptionSysOption';
import OptionMitraBisnis from 'components/OptionMitraBisnis';
import InputMaskForm from 'components/InputMask';
import SelectForm from 'components/SelectForm';
import { saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Equipment berhasil diupdate...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Equipment', to: '/equipment' }, { title: 'Create' }];

const groupDT = [
  { id: '1', key: 'A', teks: '12 Roda' },
  { id: '2', key: 'B', teks: '10 Roda' }
];

const initialValues = {
  cabang_id: '',
  abbr: '',
  kode: '',
  identity: '',
  tipe: '',
  model: '',
  manufaktur: '',
  kategori: '',
  tahun: '',
  grptire: '',
  partner_id: ''
};

export default function AddEquipmentScreen() {
  const route = useRouter();

  const validationSchema = Yup.object({
    cabang_id: Yup.number().required('Cabang wajib diisi'),

    abbr: Yup.string().max(15, 'Abbr maksimal 15 karakter').nullable(),

    kode: Yup.string().required('Kode wajib diisi').max(50, 'Kode maksimal 50 karakter'),

    identity: Yup.string().max(50, 'Identity maksimal 50 karakter').nullable(),

    tipe: Yup.string().required('Tipe wajib diisi').max(100, 'Tipe maksimal 100 karakter'),

    model: Yup.string().required('Model wajib diisi').max(100, 'Model maksimal 100 karakter'),

    manufaktur: Yup.string().required('Manufaktur wajib diisi').max(100, 'Manufaktur maksimal 100 karakter'),

    kategori: Yup.string().max(3, 'Kategori maksimal 3 karakter').nullable(),

    tahun: Yup.string()
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format tidak valid')
      .required('ThnBln wajib diisi')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/master/equipment/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT EQUIPMENT ${values.kode}` // ✅ kirim pesan custom
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // offline → simpan ke queue
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/equipment');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Add Equipment'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/equipment'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => {
            console.log(errors);
            console.log('VALUES--', values);

            return (
              <Form noValidate onSubmit={handleSubmit}>
                <HelperComponent values={values} setFieldValue={setFieldValue} />
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
                  <Grid item xs={12} sm={3} sx={{ mb: 4 }}>
                    <InputForm
                      label="Kode Equipment"
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
                  <Grid item xs={12} sm={3} sx={{ mb: 4 }}>
                    <InputForm
                      label="Alias"
                      type="text"
                      name="abbr"
                      errors={errors.abbr}
                      touched={touched.abbr}
                      value={values.abbr}
                      onChange={handleChange}
                      startAdornment={<Code1 />}
                    />
                    {Boolean(errors.abbr) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.abbr}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <InputForm
                      label="Serial Number"
                      type="text"
                      name="identity"
                      errors={errors}
                      touched={touched}
                      value={values.identity}
                      onChange={handleChange}
                      startAdornment={<Barcode />}
                    />
                    {Boolean(errors.identity) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.identity}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <InputForm
                      label="Model"
                      type="text"
                      name="model"
                      errors={errors}
                      touched={touched}
                      value={values.model}
                      onChange={handleChange}
                      startAdornment={<Barcode />}
                    />
                    {Boolean(errors.identity) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.identity}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <OptionSysOption
                      value={values.manufaktur}
                      name={'manufaktur'}
                      label="Manufaktur"
                      group={'unit-manufaktur'}
                      error={errors.manufaktur}
                      touched={touched.manufaktur}
                      startAdornment={<Award />}
                      helperText={touched.manufaktur && errors.manufaktur}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <InputMaskForm
                      label="ThnBln Pemakaian"
                      name="tahun"
                      errors={errors.tahun}
                      touched={touched.tahun}
                      value={values.tahun}
                      onChange={handleChange}
                      startAdornment={<Barcode />}
                    />
                    {Boolean(errors.tahun) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.tahun}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                    <OptionSysOption
                      value={values.kategori}
                      name={'kategori'}
                      label="Kategori"
                      group={'ctg-equipment'}
                      error={errors.kategori}
                      touched={touched.kategori}
                      startAdornment={<Award />}
                      helperText={touched.kategori && errors.kategori}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                    <OptionSysOption
                      value={values.tipe}
                      name={'tipe'}
                      label="Group Type"
                      group={'unit-sewa'}
                      error={errors.tipe}
                      touched={touched.tipe}
                      startAdornment={<Award />}
                      helperText={touched.tipe && errors.tipe}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                    <OptionMitraBisnis
                      value={values.partner_id}
                      name={'partner_id'}
                      label="Pemilik"
                      error={errors.partner_id}
                      touched={touched.partner_id}
                      startAdornment={<UserTag />}
                      helperText={touched.partner_id && errors.partner_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  {values.kategori == 'DT' && (
                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                      <SelectForm
                        array={groupDT}
                        value={values.grptire}
                        name={'grptire'}
                        label="Tires"
                        labelId="Tires"
                        placeholder={'Group Dumptruck'}
                        error={errors.grptire}
                        touched={touched.grptire}
                        startAdornment={<Weight />}
                        helperText={touched.grptire && errors.grptire}
                        onChange={handleChange}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <CardActions>
                      <Button component={Link} href="/dom" variant="outlined" color="secondary">
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

const HelperComponent = ({ values, setFieldValue }) => {
  useEffect(() => {
    if (values.kategori != 'DT') {
      setFieldValue('grptire', 'X');
    }
  }, [values, setFieldValue]);

  useEffect(() => {
    if (values.kode) {
      let teksKode = values.kode?.toUpperCase();
      setFieldValue('kode', teksKode);
    }
  }, [values.kode, setFieldValue]);

  useEffect(() => {
    if (values.abbr) {
      let teksAbbr = values.abbr?.toUpperCase();
      teksAbbr = teksAbbr.replace(/[^A-Z0-9]/g, '');
      setFieldValue('abbr', teksAbbr);
    }
  }, [values.abbr, setFieldValue]);
  return null;
};
