'use client';

import { Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button } from '@mui/material';

// THIRD - PARTY
import { Layer, Building3, AlignVertically, BagHappy, Send2, Calendar, Truck, Box } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup'; // ⬅ WAJIB
import moment from 'moment';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionCabang from 'components/OptionCabang';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionMaterialMining from 'components/OptionMaterialMining';
import InputForm from 'components/InputForm';
import SelectForm from 'components/SelectForm';
import InputAreaForm from 'components/InputAreaForm';
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
  kode: '',
  date_ops: moment().format('YYYY-MM-DD'),
  cabang_id: '',
  material_id: '',
  pit_source_id: '',
  contractor_code: '',
  cargo_type: '',
  truck_type: '',
  target_ret: 60,
  notes: ''
};

export default function CreateDom() {
  const route = useRouter();
  const validationSchema = Yup.object({
    kode: Yup.string().required('Kode DOM wajib diisi').min(5, 'Minimal 5 karakter'),
    date_ops: Yup.string().required('Tanggal operasional wajib diisi'),
    cabang_id: Yup.string().required('Cabang wajib dipilih'),
    material_id: Yup.string().required('Material wajib dipilih'),
    pit_source_id: Yup.string().required('Pit source wajib dipilih'),
    contractor_code: Yup.string().required('Contractor wajib dipilih'),
    cargo_type: Yup.string().required('Cargo type wajib dipilih'),
    truck_type: Yup.string().required('Truck type wajib dipilih'),
    target_ret: Yup.number().required('Target ritase wajib diisi').min(1, 'Minimal 1').integer('Harus bilangan bulat'),
    notes: Yup.string()
  });
  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/master/dom/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT DOM ${values.cargo_type} ${values.contractor_code}` // ✅ kirim pesan custom
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
                  <Grid item xs={12} sm={6} md={6}>
                    <InputForm
                      label="Kode DOM"
                      type="text"
                      name="kode"
                      errors={errors}
                      touched={touched}
                      value={values.kode}
                      onChange={handleChange}
                      startAdornment={<Layer />}
                      placeholder="IM 1225 BTSI 01F"
                    />
                    <span>
                      <small>
                        Format: [CARGO] [MMYY] [CONTRACTOR] [SEQUENCE][SUFFIX]
                        <br />
                        Contoh: IM 1225 BTSI 01F (Limonit) atau IM 1225 BTSI 01 (Saprolit)
                      </small>
                    </span>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InputForm
                      label="Tanggal Operasional"
                      type="date"
                      name="date_ops"
                      errors={errors}
                      touched={touched}
                      value={values.date_ops}
                      onChange={handleChange}
                      startAdornment={<Calendar />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SelectForm
                      array={[
                        { key: 'MPR', teks: 'MPR' },
                        { key: 'IMN', teks: 'IMN' }
                      ]}
                      label="Cargo Type"
                      name="cargo_type"
                      value={values.cargo_type}
                      onChange={handleChange}
                      onBlur={() => {}}
                      touched={touched}
                      errors={errors}
                      startAdornment={<Box />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <SelectForm
                      array={[
                        { key: 'BTSI', teks: 'BTSI' },
                        { key: 'B', teks: 'B' }
                      ]}
                      label="Contractor"
                      name="contractor_code"
                      value={values.contractor_code}
                      onChange={handleChange}
                      onBlur={() => {}}
                      touched={touched}
                      errors={errors}
                      startAdornment={<Building3 />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <SelectForm
                      array={[
                        { key: '10_RODA', teks: '10 Roda' },
                        { key: '12_RODA', teks: '12 Roda' }
                      ]}
                      label="Truck Type"
                      name="truck_type"
                      value={values.truck_type}
                      onChange={handleChange}
                      onBlur={() => {}}
                      touched={touched}
                      errors={errors}
                      startAdornment={<Truck />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <InputForm
                      label="Target Ritase"
                      type="number"
                      name="target_ret"
                      errors={errors}
                      touched={touched}
                      value={values.target_ret}
                      onChange={handleChange}
                      startAdornment={<Layer />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
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
                  <Grid item xs={12} sm={6} md={4}>
                    <OptionLokasiKerja
                      value={values.pit_source_id}
                      name={'pit_source_id'}
                      label="Pit Source (Stockpile)"
                      error={errors.pit_source_id}
                      touched={touched.pit_source_id}
                      startAdornment={<AlignVertically />}
                      helperText={touched.pit_source_id && errors.pit_source_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
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
                    <InputAreaForm
                      label="Catatan (opsional)"
                      name="notes"
                      errors={errors}
                      touched={touched}
                      value={values.notes}
                      onChange={handleChange}
                      rows={3}
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
    // Auto uppercase kode DOM dan normalize spaces (hanya 1 spasi)
    if (values.kode) {
      const cleaned = values.kode
        .toUpperCase()
        .replace(/\s+/g, ' ')  // Replace multiple spaces dengan 1 space
        .trim();
      setFieldValue('kode', cleaned);
    }
  }, [values.kode, setFieldValue]);
  return null;
};
