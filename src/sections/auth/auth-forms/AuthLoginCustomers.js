'use client';

import { useEffect, useState } from 'react';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import * as Yup from 'yup';
import { Formik } from 'formik';

import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { openSnackbar } from 'api/snackbar';

import { Eye, EyeSlash, Login as LoginIcon, User } from 'iconsax-react';

const AuthLoginCustomers = () => {
  const theme = useTheme();
  const [checked, setChecked] = useState(true);
  const { status, data: session } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      if (
        session?.authPortal === 'customers' ||
        String(session?.usertype || '').toLowerCase() === 'customers'
      ) {
        router.push('/customers');
      }
    }
  }, [status, session, router]);

  return (
    <Formik
      initialValues={{
        username: '',
        password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        username: Yup.string().max(255).required('Username wajib diisi'),
        password: Yup.string().max(255).required('Password wajib diisi')
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          const result = await signIn('login-customers', {
            redirect: false,
            username: values.username,
            password: values.password,
            remember: checked
          });

          if (result?.error) {
            let errorMessage = 'Login gagal. Silakan periksa username dan password Anda.';
            if (result.error === 'CredentialsSignin') {
              errorMessage = 'Username atau password salah. Silakan coba lagi.';
            } else if (result.error) {
              errorMessage = result.error;
            }
            openSnackbar({
              open: true,
              message: errorMessage,
              variant: 'alert',
              alert: { color: 'error' },
              close: true
            });
            setStatus({ success: false });
            setErrors({ submit: errorMessage });
            setSubmitting(false);
            return;
          }

          openSnackbar({
            open: true,
            message: 'Login pelanggan berhasil',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          });
          setStatus({ success: true });
          setSubmitting(false);
          router.push('/customers');
        } catch (err) {
          const errorMessage = err.message || 'Terjadi kesalahan tak terduga saat login.';
          openSnackbar({
            open: true,
            message: errorMessage,
            variant: 'alert',
            alert: { color: 'error' },
            close: true
          });
          setStatus({ success: false });
          setErrors({ submit: errorMessage });
          setSubmitting(false);
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <Box>
              <InputLabel htmlFor="customer-username-login" sx={{ mb: 1, fontWeight: 600 }}>
                Username
              </InputLabel>
              <OutlinedInput
                id="customer-username-login"
                type="text"
                value={values.username}
                name="username"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="contoh: customer.demo"
                fullWidth
                error={Boolean(touched.username && errors.username)}
                startAdornment={
                  <InputAdornment position="start">
                    <User size={18} color={theme.palette.text.secondary} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.background.default, 0.5)
                }}
              />
              {touched.username && errors.username && (
                <FormHelperText error id="helper-text-customer-username">
                  {errors.username}
                </FormHelperText>
              )}
            </Box>

            <Box>
              <InputLabel htmlFor="customer-password-login" sx={{ mb: 1, fontWeight: 600 }}>
                Password
              </InputLabel>
              <OutlinedInput
                fullWidth
                error={Boolean(touched.password && errors.password)}
                id="customer-password-login"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                name="password"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Masukkan password / kode pelanggan"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      color="secondary"
                    >
                      {showPassword ? <Eye /> : <EyeSlash />}
                    </IconButton>
                  </InputAdornment>
                }
                sx={{
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.background.default, 0.5)
                }}
              />
              {touched.password && errors.password && (
                <FormHelperText error id="helper-text-customer-password">
                  {errors.password}
                </FormHelperText>
              )}
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                  name="checked"
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Tetap masuk di perangkat ini
                </Typography>
              }
            />

            {errors.submit && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                <FormHelperText error sx={{ m: 0 }}>
                  {errors.submit}
                </FormHelperText>
              </Box>
            )}

            <AnimateButton>
              <Button
                disableElevation
                disabled={isSubmitting}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <LoginIcon size={18} />
                  )
                }
                sx={{
                  py: 1.35,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #1565c0 0%, #00897b 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0d47a1 0%, #00695c 100%)'
                  }
                }}
              >
                {isSubmitting ? 'Memproses...' : 'Masuk ke Portal'}
              </Button>
            </AnimateButton>
          </Stack>
        </form>
      )}
    </Formik>
  );
};

export default AuthLoginCustomers;
