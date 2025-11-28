'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthResetPasswordForm from 'sections/auth/auth-forms/AuthResetPasswordForm';
import { validateResetToken } from 'api/auth';

const ResetPassword = () => {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [karyawan, setKaryawan] = useState(null);
  const token = params?.token;

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('Token tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        const response = await validateResetToken(token);
        
        if (response.diagnostic.error) {
          setError(response.diagnostic.message);
        } else if (response.data.valid) {
          setKaryawan(response.data.karyawan);
        } else {
          setError('Token tidak valid');
        }
      } catch (err) {
        setError(err.response?.data?.diagnostic?.message || 'Token tidak valid atau sudah kadaluarsa');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  if (loading) {
    return (
      <AuthWrapper>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </AuthWrapper>
    );
  }

  if (error) {
    return (
      <AuthWrapper>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
              <Typography variant="h3">Reset Password</Typography>
              <Typography component={Link} href="/login" variant="body1" sx={{ textDecoration: 'none' }} color="primary">
                Back to Login
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
          <Grid item xs={12}>
            <Stack spacing={1}>
              <Typography variant="body2" color="textSecondary">
                Link reset password Anda tidak valid atau sudah kadaluarsa. Silakan request link baru.
              </Typography>
              <Typography component={Link} href="/forgot-password" variant="body1" sx={{ textDecoration: 'none' }} color="primary">
                Request Reset Password Baru
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">Reset Password</Typography>
            <Typography component={Link} href="/login" variant="body1" sx={{ textDecoration: 'none' }} color="primary">
              Back to Login
            </Typography>
          </Stack>
        </Grid>
        {karyawan && (
          <Grid item xs={12}>
            <Alert severity="info">
              Reset password untuk: <strong>{karyawan.nama}</strong>
            </Alert>
          </Grid>
        )}
        <Grid item xs={12}>
          <AuthResetPasswordForm token={token} />
        </Grid>
      </Grid>
    </AuthWrapper>
  );
};

export default ResetPassword;
