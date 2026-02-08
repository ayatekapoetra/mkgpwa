'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { Button, CardActions, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';

import { Category2, Layer, Send2, Trash } from 'iconsax-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import InputForm from 'components/InputForm';
import MainCard from 'components/MainCard';
import { openNotification } from 'api/notification';
import { useShowMaterial } from 'api/material';
import axiosServices from 'utils/axios';
import { replayRequests, saveRequest } from 'lib/offlineFetch';

const msgSuccessUpdate = {
  open: true,
  title: 'success',
  message: 'Material berhasil diupdate...',
  alert: { color: 'success' }
};

const msgSuccessDelete = {
  open: true,
  title: 'success',
  message: 'Material berhasil dihapus...',
  alert: { color: 'success' }
};

const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Material', to: '/material' }, { title: 'Edit' }];

const emptyValues = {
  nama: '',
  kategori: '',
  coefisien: '',
  aktif: 'Y'
};

export default function EditMaterialScreen() {
  const { id } = useParams();
  const router = useRouter();
  const { material, materialLoading } = useShowMaterial(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      await replayRequests();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const validationSchema = Yup.object({
    nama: Yup.string().required('Nama material wajib diisi'),
    kategori: Yup.string().required('Kategori wajib diisi'),
    coefisien: Yup.number()
      .typeError('Coefisien harus berupa angka')
      .min(0, 'Coefisien minimal 0')
      .required('Coefisien wajib diisi')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/master/material-ritase/${id}/update`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `UPDATE MATERIAL ${values.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      await axiosServices(config);
      router.push('/material');
      openNotification(msgSuccessUpdate);
    } catch (err) {
      openNotification({ ...msgError, message: err?.message || 'Gagal mengirim data' });
    }
  };

  const onDeleteHandle = async () => {
    const config = {
      url: `/master/material-ritase/${id}/destroy`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `DELETE MATERIAL ${material?.nama || ''}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      await axiosServices(config);
      router.push('/material');
      openNotification(msgSuccessDelete);
    } catch (err) {
      openNotification({ ...msgError, message: err?.message || 'Gagal menghapus data' });
    }
  };

  if (materialLoading) return <Typography variant="body1">Loading...</Typography>;

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Edit Material'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/material'} />} secondary={null} content={true}>
        <Formik
          initialValues={material || emptyValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={onSubmitHandle}
        >
          {({ errors, handleChange, handleSubmit, touched, values }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Nama Material"
                    type="text"
                    name="nama"
                    errors={errors}
                    touched={touched}
                    value={values.nama}
                    onChange={handleChange}
                    startAdornment={<Layer />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Kategori"
                    type="text"
                    name="kategori"
                    errors={errors}
                    touched={touched}
                    value={values.kategori}
                    onChange={handleChange}
                    startAdornment={<Category2 />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                  <InputForm
                    label="Coefisien"
                    type="number"
                    name="coefisien"
                    errors={errors}
                    touched={touched}
                    value={values.coefisien}
                    onChange={handleChange}
                    startAdornment={<Layer />}
                    min={0}
                  />
                </Grid>

                <Grid item xs={12}>
                  <CardActions>
                    <Button component={Link} href="/material" variant="outlined" color="secondary">
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
          )}
        </Formik>
      </MainCard>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus material "{material?.nama}"?</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Tindakan ini tidak dapat dibatalkan. Data akan dinonaktifkan (soft delete).
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
