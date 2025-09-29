'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { CardActions, Grid, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

// THIRD - PARTY
import { Building3, Send2, Trash } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

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
import { useShowLokasiKerja } from 'api/lokasi-kerja';
import OptionSysOption from 'components/OptionSysOption';
import { replayRequests, saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Lokasi Kerja berhasil diupdate...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Lokasi Kerja', to: '/lokasi-kerja' }, { title: 'Show' }];

export default function ShowLokasiKerjaScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { data: initialValues, dataLoading } = useShowLokasiKerja(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const validationSchema = Yup.object({
    nama: Yup.string().required('Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    type: Yup.string().required('Type wajib diisi'),
    abbr: Yup.string().max(30, 'Abbr maksimal 30 karakter'),
    cabang_id: Yup.number().required('Cabang wajib diisi')
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
      url: `/api/master/lokasi-kerja/${id}/update`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `UPDATE LOKASI KERJA ${values.nama}`
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

  const onDeleteHandle = async () => {
    const config = {
      url: `/api/master/lokasi-kerja/${id}/destroy`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `DELETE LOKASI KERJA ${initialValues?.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      setOpenDeleteDialog(false);
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      route.push('/lokasi-kerja');
      openNotification({ ...msgSuccess, message: 'Lokasi Kerja berhasil dihapus...' });
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error('Delete error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal menghapus data' });
      setOpenDeleteDialog(false);
    }
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Edit Lokasi Kerja'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/lokasi-kerja'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues || { nama: '', type: '', cabang_id: '' }} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
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
                    <OptionSysOption
                      value={values.type}
                      name={'type'}
                      label="Type"
                      group={'lokasi-type'}
                      error={errors.type}
                      touched={touched.type}
                      startAdornment={<Building3 />}
                      helperText={touched.type && errors.type}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                   <Grid item xs={12}>
                     <CardActions>
                       <Button component={Link} href="/lokasi-kerja" variant="outlined" color="secondary">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus Lokasi Kerja "{initialValues?.nama}"?</Typography>
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