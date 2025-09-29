'use client';

import { Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button } from '@mui/material';

// THIRD - PARTY
import { Layer, Building3, AlignVertically, BagHappy, Send2 } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup'; // ⬅ WAJIB
// import moment from 'moment';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionCabang from 'components/OptionCabang';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionMaterialMining from 'components/OptionMaterialMining';
import InputForm from 'components/InputForm';
import axiosServices from 'utils/axios';
import { saveRequest } from 'lib/offlineFetch';

// HOOK
import { openNotification } from 'api/notification';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Dom berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Dom', to: '/dom' }, { title: 'Create' }];

const initialValues = {
  cabang_id: '',
  lokasi_id: '',
  material_id: '',
  no_dom: ''
};

export default function CreateDom() {
  const route = useRouter();
  const validationSchema = Yup.object({
    cabang_id: Yup.string().required('Cabang wajib dipilih'),

    lokasi_id: Yup.string().required('Lokasi wajib dipilih'),

    material_id: Yup.string().required('Material wajib dipilih'),

    no_dom: Yup.string().required('Nomor DOM wajib diisi').min(3, 'Minimal 3 karakter')
  });
  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/master/dom/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT DOM ${values.no_dom}` // ✅ kirim pesan custom
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // offline → simpan ke queue
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log('RESP.', resp);
      route.push('/dom');
      openNotification(msgSuccess);
    } catch (error) {
      console.error('Submit error:', error);
      openNotification({ ...msgError, message: error?.diagnostic?.error || 'Gagal mengirim data' });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Dom'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/dom'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => {
            return (
              <Form noValidate onSubmit={handleSubmit}>
                <HelperComponent values={values} setFieldValue={setFieldValue} />
                <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={6}>
                    <InputForm
                      label="Nomor Dom"
                      type="text"
                      name="no_dom"
                      errors={errors}
                      touched={touched}
                      value={values.no_dom}
                      onChange={handleChange}
                      startAdornment={<Layer />}
                    />
                    <span>
                      <small>contoh format : IM.05.25.MTK.01</small>
                    </span>
                  </Grid>
                </Grid>
                <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={4} sx={{ mt: 3 }}>
                    <OptionCabang
                      value={values.cabang_id}
                      name={'cabang_id'}
                      label="Nama Cabang"
                      error={errors.cabang_id}
                      touched={touched.cabang_id}
                      startAdornment={<Building3 />}
                      helperText={touched.cabang_id && errors.cabang_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mt: 1 }}>
                    <OptionLokasiKerja
                      value={values.lokasi_id}
                      name={'lokasi_id'}
                      label="Lokasi Kerja"
                      error={errors.lokasi_id}
                      touched={touched.lokasi_id}
                      startAdornment={<AlignVertically />}
                      helperText={touched.lokasi_id && errors.lokasi_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ mt: 1 }}>
                    <OptionMaterialMining
                      value={values.material_id}
                      name={'material_id'}
                      label="Jenis Material"
                      error={errors.material_id}
                      touched={touched.material_id}
                      startAdornment={<BagHappy />}
                      helperText={touched.material_id && errors.material_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
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
    if (values.no_dom) {
      setFieldValue('no_dom', values.no_dom?.toUpperCase());
    }
  }, [values, setFieldValue]);
  return null;
};
