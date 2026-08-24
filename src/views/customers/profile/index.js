'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import { alpha, useTheme } from '@mui/material/styles';

import IconButton from 'components/@extended/IconButton';
import CircularLoader from 'components/CircularLoader';
import { updateCustomersProfile, useGetCustomersProfile } from 'api/customers-profile';
import {
  Building4,
  Call,
  Eye,
  EyeSlash,
  Lock1,
  ProfileCircle,
  Sms,
  User
} from 'iconsax-react';

const validationSchema = Yup.object({
  username: Yup.string().min(3, 'Username minimal 3 karakter').required('Username wajib diisi'),
  email: Yup.string().email('Format email tidak valid').nullable(),
  phone: Yup.string().nullable(),
  npwp: Yup.string().nullable(),
  cp: Yup.string().nullable(),
  cpphone: Yup.string().nullable(),
  alamat_kirim: Yup.string().nullable(),
  password: Yup.string().min(6, 'Password minimal 6 karakter').nullable(),
  password_confirmation: Yup.string().when('password', {
    is: (value) => Boolean(value && String(value).length),
    then: (schema) =>
      schema
        .required('Konfirmasi password wajib diisi')
        .oneOf([Yup.ref('password')], 'Konfirmasi password tidak cocok'),
    otherwise: (schema) => schema.nullable()
  })
});

const FieldBlock = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  readOnly = false,
  multiline = false,
  rows = 1,
  type = 'text',
  startIcon = null,
  endAdornment = null
}) => (
  <Box>
    <InputLabel htmlFor={name} sx={{ mb: 1, fontWeight: 600 }}>
      {label}
    </InputLabel>
    <OutlinedInput
      id={name}
      name={name}
      fullWidth
      type={type}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      readOnly={readOnly}
      multiline={multiline}
      rows={rows}
      error={Boolean(touched && error)}
      startAdornment={
        startIcon ? <InputAdornment position="start">{startIcon}</InputAdornment> : undefined
      }
      endAdornment={endAdornment}
      sx={{
        borderRadius: 2.5,
        bgcolor: (theme) =>
          readOnly ? alpha(theme.palette.action.hover, 0.4) : alpha(theme.palette.background.default, 0.5)
      }}
    />
    {touched && error ? <FormHelperText error>{error}</FormHelperText> : null}
  </Box>
);

export default function CustomersProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  const { data, dataLoading, dataError, mutate } = useGetCustomersProfile();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login-customers');
      return;
    }
    if (status === 'authenticated') {
      const isCustomer =
        session?.authPortal === 'customers' ||
        String(session?.usertype || '').toLowerCase() === 'customers';
      if (!isCustomer) router.push('/home');
    }
  }, [status, session, router]);

  const initialValues = useMemo(
    () => ({
      kode: data?.pelanggan?.kode || '',
      abbr: data?.pelanggan?.abbr || '',
      nama: data?.pelanggan?.nama || '',
      email: data?.pelanggan?.email || '',
      phone: data?.pelanggan?.phone || '',
      npwp: data?.pelanggan?.npwp || '',
      cp: data?.pelanggan?.cp || '',
      cpphone: data?.pelanggan?.cpphone || '',
      alamat_kirim: data?.pelanggan?.alamat_kirim || '',
      username: data?.user?.username || '',
      password: '',
      password_confirmation: ''
    }),
    [data]
  );

  if (status === 'loading' || dataLoading) {
    return <CircularLoader />;
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 3.5 } }}>
      <Card
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha('#6a1b9a', 0.1)} 0%, ${alpha('#1565c0', 0.06)} 100%)`
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#6a1b9a', 0.14),
                color: '#6a1b9a'
              }}
            >
              <ProfileCircle size={24} variant="Bold" />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                Update Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Perbarui data kontak pelanggan dan akun login portal
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {dataError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Gagal memuat data profil.
        </Alert>
      ) : null}

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
          try {
            const payload = {
              username: values.username,
              email: values.email || '',
              phone: values.phone || '',
              npwp: values.npwp || '',
              cp: values.cp || '',
              cpphone: values.cpphone || '',
              alamat_kirim: values.alamat_kirim || ''
            };

            if (values.password) {
              payload.password = values.password;
              payload.password_confirmation = values.password_confirmation;
            }

            const result = await updateCustomersProfile(payload);
            const rows = result?.rows;

            await mutate();

            if (updateSession) {
              await updateSession({
                name: rows?.pelanggan?.nama || session?.name,
                nama: rows?.pelanggan?.nama || session?.nama,
                phone: rows?.pelanggan?.phone || session?.phone,
                username: rows?.user?.username || session?.username,
                pelanggan_nama: rows?.pelanggan?.nama || session?.pelanggan_nama,
                pelanggan_kode: rows?.pelanggan?.kode || session?.pelanggan_kode,
                pelanggan_email: rows?.pelanggan?.email || session?.pelanggan_email,
                pelanggan_phone: rows?.pelanggan?.phone || session?.pelanggan_phone
              });
            }

            enqueueSnackbar(result?.diagnostic?.message || 'Profil berhasil diperbarui', {
              variant: 'success'
            });

            resetForm({
              values: {
                ...values,
                password: '',
                password_confirmation: '',
                username: rows?.user?.username || values.username,
                email: rows?.pelanggan?.email || values.email,
                phone: rows?.pelanggan?.phone || values.phone,
                npwp: rows?.pelanggan?.npwp || values.npwp,
                cp: rows?.pelanggan?.cp || values.cp,
                cpphone: rows?.pelanggan?.cpphone || values.cpphone,
                alamat_kirim: rows?.pelanggan?.alamat_kirim || values.alamat_kirim
              }
            });
          } catch (error) {
            const message =
              error?.response?.data?.diagnostic?.message ||
              error?.message ||
              'Gagal memperbarui profil';
            setErrors({ submit: message });
            enqueueSnackbar(message, { variant: 'error' });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting
        }) => (
          <Form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                      <Building4 size={18} />
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Data Pelanggan
                      </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FieldBlock label="Kode" name="kode" value={values.kode} readOnly />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FieldBlock label="Abbr" name="abbr" value={values.abbr} readOnly />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FieldBlock label="Nama" name="nama" value={values.nama} readOnly />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="Email"
                          name="email"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.email}
                          touched={touched.email}
                          placeholder="email@perusahaan.com"
                          startIcon={<Sms size={16} />}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="Phone"
                          name="phone"
                          value={values.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.phone}
                          touched={touched.phone}
                          placeholder="08xxxxxxxxxx"
                          startIcon={<Call size={16} />}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="NPWP"
                          name="npwp"
                          value={values.npwp}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.npwp}
                          touched={touched.npwp}
                          placeholder="NPWP perusahaan"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="Contact Person"
                          name="cp"
                          value={values.cp}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.cp}
                          touched={touched.cp}
                          placeholder="Nama contact person"
                          startIcon={<User size={16} />}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="CP Phone"
                          name="cpphone"
                          value={values.cpphone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.cpphone}
                          touched={touched.cpphone}
                          placeholder="Nomor HP contact person"
                          startIcon={<Call size={16} />}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FieldBlock
                          label="Alamat Kirim"
                          name="alamat_kirim"
                          value={values.alamat_kirim}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.alamat_kirim}
                          touched={touched.alamat_kirim}
                          placeholder="Alamat pengiriman"
                          multiline
                          rows={3}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                      <Lock1 size={18} />
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Akun Login
                      </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="Username"
                          name="username"
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.username}
                          touched={touched.username}
                          placeholder="Username unik"
                          startIcon={<User size={16} />}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="Email Akun"
                          name="email_account"
                          value={values.email}
                          readOnly
                          startIcon={<Sms size={16} />}
                        />
                        <FormHelperText>
                          Email akun mengikuti email pelanggan di atas
                        </FormHelperText>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="Password Baru"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.password}
                          touched={touched.password}
                          placeholder="Kosongkan jika tidak diubah"
                          startIcon={<Lock1 size={16} />}
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
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FieldBlock
                          label="Konfirmasi Password"
                          name="password_confirmation"
                          type={showPasswordConfirm ? 'text' : 'password'}
                          value={values.password_confirmation}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.password_confirmation}
                          touched={touched.password_confirmation}
                          placeholder="Ulangi password baru"
                          startIcon={<Lock1 size={16} />}
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
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {errors.submit ? (
                <Grid item xs={12}>
                  <Alert severity="error">{errors.submit}</Alert>
                </Grid>
              ) : null}

              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => router.push('/customers')}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={
                      isSubmitting ? <CircularProgress size={16} color="inherit" /> : <ProfileCircle size={16} />
                    }
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      fontWeight: 700,
                      px: 3,
                      background: 'linear-gradient(135deg, #6a1b9a 0%, #1565c0 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4a148c 0%, #0d47a1 100%)'
                      }
                    }}
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Container>
  );
}
