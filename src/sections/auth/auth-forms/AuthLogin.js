'use client';

import { useState, useEffect } from 'react';

// NEXT
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// MATERIAL - UI
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Links from '@mui/material/Link';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';

// THIRD - PARTY
import * as Yup from 'yup';
import { Formik } from 'formik';

// PROJECT IMPORTS
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import useScriptRef from 'hooks/useScriptRef';
import { openSnackbar } from 'api/snackbar';

// ASSETS
import { Eye, EyeSlash } from 'iconsax-react';

// ============================|| JWT - LOGIN ||============================ //

const AuthLogin = () => {
  const scriptedRef = useScriptRef();
  const [checked, setChecked] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Redirect ke home jika sudah login
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status, router]);

  return (
    <Formik
      id="login-formik-container"
      name="loginFormikContainer"
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
          const result = await signIn('login', {
            redirect: false,
            username: values.username,
            password: values.password,
            remember: checked // Send remember me value
          });

          if (result?.error) {
            // Login gagal
            let errorMessage = 'Login gagal. Silakan periksa username dan password Anda.';
            if (result.error === 'CredentialsSignin') {
              errorMessage = 'Username atau password salah. Silakan coba lagi.';
            } else if (result.error.includes('EmailCreateOnly')) {
              errorMessage = 'Akun belum terverifikasi. Silakan periksa email Anda.';
            } else if (result.error) {
              errorMessage = `Login gagal: ${result.error}`;
            }
            openSnackbar({
              open: true,
              message: errorMessage,
              variant: 'alert',
              alert: {
                color: 'error'
              },
              close: true
            });

            if (scriptedRef.current) {
              setStatus({ success: false });
              setErrors({ submit: errorMessage });
              setSubmitting(false);
            }
          } else if (result?.ok) {
            // Login berhasil
            openSnackbar({
              open: true,
              message: 'Login berhasil! Mengalihkan ke halaman utama...',
              variant: 'alert',
              alert: {
                color: 'success'
              },
              close: true
            });

            if (scriptedRef.current) {
              setStatus({ success: true });
              setSubmitting(false);
            }

            // Redirect ke home setelah delay singkat
            setTimeout(() => {
              router.push('/home');
            }, 1000);
          }
        } catch (err) {
          // Error tak terduga
          const errorMessage = err.message || 'Terjadi kesalahan tak terduga saat login.';
          openSnackbar({
            open: true,
            message: errorMessage,
            variant: 'alert',
            alert: {
              color: 'error'
            },
            close: true
          });

          if (scriptedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: errorMessage });
            setSubmitting(false);
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form id="login-form-element" name="loginFormElement" noValidate onSubmit={handleSubmit}>
          <Grid id="login-grid-container" name="loginGridContainer" container spacing={3}>
            <Grid id="username-field-container" name="usernameFieldContainer" item xs={12}>
              <Stack id="username-field-stack" name="usernameFieldStack" spacing={1}>
                <InputLabel id="username-label" name="usernameLabel" htmlFor="email-login">
                  Username
                </InputLabel>
                <OutlinedInput
                  id="username-login"
                  name="username"
                  type="text"
                  value={values.username}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  fullWidth
                  error={Boolean(touched.username && errors.username)}
                />
                {touched.username && errors.username && (
                  <FormHelperText id="username-error-text" name="usernameErrorText" error>
                    {errors.username}
                  </FormHelperText>
                )}
              </Stack>
            </Grid>

            <Grid id="password-field-container" name="passwordFieldContainer" item xs={12}>
              <Stack id="password-field-stack" name="passwordFieldStack" spacing={1}>
                <InputLabel id="password-label" name="passwordLabel" htmlFor="password-login">
                  Password
                </InputLabel>
                <OutlinedInput
                  id="password-login"
                  name="password"
                  fullWidth
                  error={Boolean(touched.password && errors.password)}
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        id="password-toggle-button"
                        name="passwordToggleButton"
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        color="secondary"
                      >
                        {showPassword ? <Eye /> : <EyeSlash />}
                      </IconButton>
                    </InputAdornment>
                  }
                  placeholder="Masukkan password"
                />
                {touched.password && errors.password && (
                  <FormHelperText id="password-error-text" name="passwordErrorText" error>
                    {errors.password}
                  </FormHelperText>
                )}
              </Stack>
            </Grid>

            <Grid id="login-options-container" name="loginOptionsContainer" item xs={12} sx={{ mt: -1 }}>
              <Stack
                id="login-options-stack"
                name="loginOptionsStack"
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
              >
                <FormControlLabel
                  id="remember-me-checkbox"
                  name="rememberMeCheckbox"
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={(event) => setChecked(event.target.checked)}
                      name="rememberMeInput"
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="h6">Ingat saya</Typography>}
                />
                <Links
                  id="forgot-password-link"
                  name="forgotPasswordLink"
                  variant="h6"
                  component={Link}
                  href={session ? '/auth/forgot-password' : '/forgot-password'}
                  color="text.primary"
                >
                  Lupa Password?
                </Links>
              </Stack>
            </Grid>

            {errors.submit && (
              <Grid id="submit-error-container" name="submitErrorContainer" item xs={12}>
                <FormHelperText id="submit-error-text" name="submitErrorText" error>
                  {errors.submit}
                </FormHelperText>
              </Grid>
            )}

            <Grid id="login-button-container" name="loginButtonContainer" item xs={12}>
              <AnimateButton>
                <Button
                  id="login-submit-button"
                  name="loginSubmitButton"
                  disableElevation
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Login
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
};

export default AuthLogin;
