'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography, Box, Chip } from '@mui/material';

// THIRD - PARTY
import { Layer, Building3, AlignVertically, BagHappy, Send2, Calendar, Truck, Box as BoxIcon, CloseCircle } from 'iconsax-react';
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

// HOOK
import { openNotification } from 'api/notification';
import { useShowDom } from 'api/dom';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Dom berhasil diupdate...',
  alert: { color: 'success' }
};
const msgSuccessClose = {
  open: true,
  title: 'success',
  message: 'DOM berhasil di-close',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Dom', to: '/dom' }, { title: 'Show' }];

export default function ShowDomScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { data: initialValues, dataLoading } = useShowDom(id);
  const [openCloseDialog, setOpenCloseDialog] = useState(false);

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
    console.log('values.', values);
    
    try {
      await axiosServices.post(`/api/master/dom/${id}/update`, values);
      route.push('/dom');
      openNotification(msgSuccess);
    } catch (error) {
      openNotification({ ...msgError, message: error?.diagnostic?.error || '...' });
    }
  };

  const handleCloseDom = async () => {
    try {
      await axiosServices.post(`/api/master/dom/${id}/close`);
      openNotification(msgSuccessClose);
      setOpenCloseDialog(false);
      route.push('/dom');
    } catch (error) {
      console.error('Close DOM error:', error);
      openNotification({
        ...msgError,
        message: error?.response?.data?.diagnostic?.error || error?.message || 'Gagal close DOM'
      });
      setOpenCloseDialog(false);
    }
  };

  if (dataLoading) {
    return <div>Loading data...</div>;
  }

  const isClosedDom = initialValues?.status === 'CLOSED';

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Update Dom'} links={breadcrumbLinks} />
      <MainCard 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BtnBack href={'/dom'} />
            {isClosedDom && (
              <Chip 
                label="CLOSED" 
                color="error" 
                size="small" 
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>
        } 
        secondary={null} 
        content={true}
      >
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
                        { key: 'MPR', teks: 'MPR (Import)' },
                        { key: 'IMN', teks: 'IMN (Barge)' }
                      ]}
                      label="Cargo Type"
                      name="cargo_type"
                      value={values.cargo_type}
                      onChange={handleChange}
                      onBlur={() => {}}
                      touched={touched}
                      errors={errors}
                      startAdornment={<BoxIcon />}
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
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Box>
                        <Button component={Link} href="/dom" variant="outlined" color="secondary">
                          Batal
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isClosedDom && (
                          <Button 
                            onClick={() => setOpenCloseDialog(true)} 
                            variant="outlined" 
                            color="warning"
                            startIcon={<CloseCircle />}
                          >
                            Close DOM
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          variant="contained" 
                          startIcon={<Send2 />}
                          disabled={isClosedDom}
                        >
                          Simpan
                        </Button>
                      </Box>
                    </CardActions>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </MainCard>

      {/* Close DOM Confirmation Dialog */}
      <Dialog open={openCloseDialog} onClose={() => setOpenCloseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5">Close DOM</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Box sx={{ mb: 2 }}>
              Apakah Anda yakin ingin menutup DOM ini?
            </Box>
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'warning.lighter', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'warning.main'
            }}>
              <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 500 }}>
                ⚠️ Perhatian:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                • Status DOM akan berubah menjadi <strong>CLOSED</strong>
                <br />
                • DOM yang sudah di-close tidak dapat diubah lagi
                <br />
                • Pastikan semua data ritase sudah sesuai sebelum menutup DOM
              </Typography>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCloseDialog(false)} color="secondary" variant="outlined">
            Batal
          </Button>
          <Button onClick={handleCloseDom} color="warning" variant="contained" autoFocus>
            Ya, Close DOM
          </Button>
        </DialogActions>
      </Dialog>
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
      if (cleaned !== values.kode) {
        setFieldValue('kode', cleaned);
      }
    }

    // Format date_ops jika dalam format DD-MM-YYYY atau timestamp
    if (values.date_ops) {
      const dateStr = String(values.date_ops);
      
      // Jika format DD-MM-YYYY, convert ke YYYY-MM-DD
      if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateStr.split('-');
        setFieldValue('date_ops', `${year}-${month}-${day}`);
      }
      // Jika timestamp atau Date object, convert ke YYYY-MM-DD
      else if (dateStr.includes('T') || dateStr.length > 10) {
        const date = moment(dateStr);
        if (date.isValid()) {
          setFieldValue('date_ops', date.format('YYYY-MM-DD'));
        }
      }
    }
  }, [values.kode, values.date_ops, setFieldValue]);
  return null;
};
