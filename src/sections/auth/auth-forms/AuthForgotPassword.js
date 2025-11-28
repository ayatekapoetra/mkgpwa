'use client';

// NEXT
import { useRouter } from 'next/navigation';

// MATERIAL - UI
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';

// THIRD - PARTY
import * as Yup from 'yup';
import { Formik } from 'formik';

// PROJECT IMPORTS
import useScriptRef from 'hooks/useScriptRef';
import AnimateButton from 'components/@extended/AnimateButton';
import { openSnackbar } from 'api/snackbar';
import useUser from 'hooks/useUser';
import { forgotPassword } from 'api/auth';

// ============================|| FIREBASE - FORGOT PASSWORD ||============================ //

const AuthForgotPassword = () => {
  const scriptedRef = useScriptRef();
  const router = useRouter();
  const user = useUser();

  return (
    <Formik
      initialValues={{
        phone: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        phone: Yup.string()
          .matches(/^[0-9+]+$/, 'Nomor handphone hanya boleh berisi angka')
          .min(10, 'Nomor handphone minimal 10 digit')
          .max(15, 'Nomor handphone maksimal 15 digit')
          .required('Nomor handphone wajib diisi')
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          const response = await forgotPassword(values.phone);
          
          if (scriptedRef.current) {
            setStatus({ success: true });
            setSubmitting(false);
            openSnackbar({
              open: true,
              message: 'Link reset password telah dikirim ke WhatsApp Anda',
              variant: 'alert',
              alert: {
                color: 'success'
              }
            });
            setTimeout(() => {
              router.push(user ? '/auth/check-mail' : '/check-mail');
            }, 1500);
          }
        } catch (err) {
          if (scriptedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: err.message || 'Nomor handphone tidak terdaftar' });
            setSubmitting(false);
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel htmlFor="phone-forgot">Nomor Handphone</InputLabel>
                <OutlinedInput
                  fullWidth
                  error={Boolean(touched.phone && errors.phone)}
                  id="phone-forgot"
                  type="tel"
                  value={values.phone}
                  name="phone"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Masukkan nomor handphone"
                  inputProps={{}}
                />
                {touched.phone && errors.phone && (
                  <FormHelperText error id="helper-text-phone-forgot">
                    {errors.phone}
                  </FormHelperText>
                )}
              </Stack>
            </Grid>
            {errors.submit && (
              <Grid item xs={12}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Grid>
            )}
            <Grid item xs={12} sx={{ mb: -2 }}>
              <Typography variant="caption">Link reset password akan dikirim ke WhatsApp Anda.</Typography>
            </Grid>
            <Grid item xs={12}>
              <AnimateButton>
                <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
                  Reset Password
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
};

export default AuthForgotPassword;
