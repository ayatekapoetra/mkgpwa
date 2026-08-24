'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import {
  CardActions,
  Grid,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';

import { Building3, Send2, Trash, Code, User, Lock1, Eye, EyeSlash } from 'iconsax-react';
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
import { useShowPenyewa } from 'api/penyewa';
import { replayRequests, saveRequest } from 'lib/offlineFetch';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Penyewa berhasil diupdate...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Penyewa', to: '/penyewa' }, { title: 'Show' }];

export default function ShowPenyewaScreen() {
  const route = useRouter();
  const { id } = useParams();
  const { penyewa: data, penyewaLoading: dataLoading } = useShowPenyewa(id);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const initialValues = useMemo(() => {
    if (!data) {
      return {
        bisnis_id: '',
        kode: '',
        abbr: '',
        nama: '',
        cp: '',
        cpphone: '',
        username: '',
        password: '',
        password_confirmation: '',
        usertype: 'customers',
        user_id: null
      };
    }

    return {
      bisnis_id: data.bisnis_id || '',
      kode: data.kode || '',
      abbr: data.abbr || '',
      nama: data.nama || '',
      cp: data.cp || '',
      cpphone: data.cpphone || '',
      username: data.portal_username || '',
      password: '',
      password_confirmation: '',
      usertype: 'customers',
      user_id: data.user_id || data.portal_user_id || null,
      nama_display: data.nama || ''
    };
  }, [data]);

  const validationSchema = Yup.object({
    bisnis_id: Yup.number().required('Bisnis Unit wajib diisi'),
    kode: Yup.string().required('Kode wajib diisi'),
    abbr: Yup.string().required('Abbr wajib diisi'),
    nama: Yup.string().required('Nama wajib diisi'),
    cp: Yup.string().required('Nama CP wajib diisi'),
    cpphone: Yup.string()
      .matches(/^62\d+$/, 'No HP harus diawali 62 dan hanya angka')
      .required('No HP wajib diisi'),
    username: Yup.string()
      .trim()
      .test('username-min', 'Username minimal 3 karakter', (value) => {
        if (!value) return true;
        return value.length >= 3;
      }),
    password: Yup.string()
      .nullable()
      .test('password-min', 'Password minimal 6 karakter', (value) => {
        if (!value) return true;
        return value.length >= 6;
      }),
    password_confirmation: Yup.string().when('password', {
      is: (val) => !!val,
      then: (schema) =>
        schema.required('Konfirmasi password wajib diisi').oneOf([Yup.ref('password')], 'Konfirmasi password tidak cocok'),
      otherwise: (schema) => schema.nullable()
    })
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
    const payload = {
      bisnis_id: values.bisnis_id,
      kode: values.kode,
      abbr: values.abbr,
      nama: values.nama,
      cp: values.cp,
      cpphone: values.cpphone,
      username: values.username?.trim() || '',
      usertype: 'customers'
    };

    if (values.password) {
      payload.password = values.password;
      payload.password_confirmation = values.password_confirmation;
    }

    const config = {
      url: `/master/penyewa/${id}/update`,
      method: 'POST',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `UPDATE PENYEWA ${values.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      await axiosServices(config);
      route.push('/penyewa');
      openNotification(msgSuccess);
    } catch (err) {
      console.error('Submit error:', err);
      const message =
        err?.response?.data?.diagnostic?.message || err?.response?.data?.message || err?.message || 'Gagal mengirim data';
      openNotification({ ...msgError, message });
    }
  };

  const onDeleteHandle = async () => {
    const config = {
      url: `/master/penyewa/${id}/destroy`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `DELETE PENYEWA ${initialValues?.nama}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      await axiosServices(config);
      route.push('/penyewa');
      openNotification({ ...msgSuccess, message: 'Penyewa berhasil dihapus...' });
    } catch (err) {
      console.error('Delete error:', err);
      openNotification({ ...msgError, message: err?.message || 'Gagal menghapus data' });
    }
  };

  if (dataLoading) return <Typography variant="body1">Loading...</Typography>;

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Edit Penyewa'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/penyewa'} />} secondary={null} content={true}>
        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={onSubmitHandle}
        >
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
                      value={values.kode || ''}
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
                      value={values.abbr || ''}
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
                      value={values.nama || ''}
                      onChange={handleChange}
                      startAdornment={<User />}
                    />
                    {Boolean(errors.nama) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.nama}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Nama CP"
                      type="text"
                      name="cp"
                      errors={errors.cp}
                      touched={touched.cp}
                      value={values.cp || ''}
                      onChange={handleChange}
                      startAdornment={<User />}
                    />
                    {Boolean(errors.cp) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.cp}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="No HP CP (diawali 62)"
                      type="text"
                      name="cpphone"
                      errors={errors.cpphone}
                      touched={touched.cpphone}
                      value={values.cpphone || ''}
                      onChange={handleChange}
                      startAdornment={<Code />}
                    />
                    {Boolean(errors.cpphone) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.cpphone}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
                      Akun Portal Pelanggan
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Isi username &amp; password untuk menghubungkan penyewa ke akun portal (`usertype=customers`). Password kosong = tidak
                      diubah.
                      {values.user_id ? ` User terhubung: #${values.user_id}` : ' Belum terhubung ke user.'}
                    </Alert>
                  </Grid>

                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Username Portal"
                      type="text"
                      name="username"
                      errors={errors.username}
                      touched={touched.username}
                      value={values.username || ''}
                      onChange={handleChange}
                      startAdornment={<User />}
                      placeholder="unique username"
                    />
                    {Boolean(errors.username && touched.username) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.username}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Usertype"
                      type="text"
                      name="usertype"
                      value="customers"
                      readOnly
                      startAdornment={<Code />}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Password Portal"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      errors={errors.password}
                      touched={touched.password}
                      value={values.password || ''}
                      onChange={handleChange}
                      startAdornment={<Lock1 />}
                      placeholder={values.user_id ? 'Kosongkan jika tidak diubah' : 'Wajib jika buat akun baru'}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            color="secondary"
                          >
                            {showPassword ? <Eye /> : <EyeSlash />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                    {Boolean(errors.password && touched.password) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.password}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6} sx={{ mb: 4 }}>
                    <InputForm
                      label="Konfirmasi Password"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      name="password_confirmation"
                      errors={errors.password_confirmation}
                      touched={touched.password_confirmation}
                      value={values.password_confirmation || ''}
                      onChange={handleChange}
                      startAdornment={<Lock1 />}
                      placeholder="Ulangi password"
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPasswordConfirm((prev) => !prev)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            color="secondary"
                          >
                            {showPasswordConfirm ? <Eye /> : <EyeSlash />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                    {Boolean(errors.password_confirmation && touched.password_confirmation) && (
                      <Typography variant="body2" color="error" gutterBottom>
                        {errors.password_confirmation}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <CardActions>
                      <Button component={Link} href="/penyewa" variant="outlined" color="secondary">
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

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus Penyewa &quot;{initialValues?.nama}&quot;?</Typography>
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
