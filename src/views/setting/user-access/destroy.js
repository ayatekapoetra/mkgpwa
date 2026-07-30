'use client';

import { Fragment, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import {
  CardActions,
  Grid,
  Button,
  Stack,
  Typography,
  Box,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Trash, Warning2, ArrowLeft } from 'iconsax-react';
import { mutate } from 'swr';

import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import CircularLoader from 'components/CircularLoader';
import axiosServices from 'utils/axios';
import { openNotification } from 'api/notification';
import { endpoints, useShowUserAccess } from 'api/menu';
import { PERMISSION_KEYS, countActivePerms, getInitials } from './permission-config';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'User access berhasil dihapus...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'User Access', to: '/user-access' },
  { title: 'Delete' }
];

export default function DestroyUserAccess() {
  const route = useRouter();
  const theme = useTheme();
  const { id } = useParams();
  const { data: accessData, dataLoading, dataError } = useShowUserAccess(id);
  const [submitting, setSubmitting] = useState(false);

  const userName = accessData[0]?.user?.nmlengkap || accessData[0]?.nmuser || `User #${id}`;
  const userType = accessData[0]?.user?.usertype;

  const onSubmitHandle = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await axiosServices.post(`/setting/akses-menu/${id}/destroy`);
      mutate((key) => typeof key === 'string' && key.includes(endpoints.keySetting));
      route.push('/user-access');
      openNotification(msgSuccess);
    } catch (error) {
      openNotification({
        ...msgError,
        message: error?.diagnostic?.error || error?.message || 'Gagal menghapus data'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <Box sx={{ py: 10 }}>
        <CircularLoader />
      </Box>
    );
  }

  if (dataError) {
    return (
      <MainCard>
        <Stack spacing={1} alignItems="center" py={6}>
          <Typography variant="h5" color="error">
            Gagal memuat data akses
          </Typography>
          <Button component={Link} href="/user-access" variant="outlined">
            Kembali
          </Button>
        </Stack>
      </MainCard>
    );
  }

  return (
    <Fragment>
      <Breadcrumbs custom heading="Delete User Access" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/user-access" />} content>
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            borderColor: alpha(theme.palette.error.main, 0.35),
            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.12)} 0%, ${theme.palette.background.paper} 65%)`
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.16),
                color: 'error.main',
                flexShrink: 0
              }}
            >
              <Warning2 size={26} variant="Bold" />
            </Box>
            <Box>
              <Typography variant="h4" color="error.main">
                Hapus Semua Akses User
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Tindakan ini akan menonaktifkan seluruh privilege menu untuk user berikut. Sidebar & fitur terkait tidak lagi tersedia.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Soft-delete: record permission di-set <strong>aktif = N</strong>. Data tidak dihapus permanen dari database.
        </Alert>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(theme.palette.error.main, 0.12),
                    color: 'error.main',
                    fontWeight: 800,
                    fontSize: 20
                  }}
                >
                  {getInitials(userName)}
                </Box>
                <Box>
                  <Typography variant="h5">{userName}</Typography>
                  {userType && (
                    <Chip size="small" label={userType} variant="outlined" sx={{ mt: 0.75 }} />
                  )}
                </Box>
                <Divider flexItem />
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Chip color="error" label={`${accessData.length} menu`} />
                  <Chip
                    variant="outlined"
                    label={`${accessData.reduce((s, r) => s + countActivePerms(r), 0)} flag aktif`}
                  />
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Daftar akses yang akan dinonaktifkan
            </Typography>
            <Stack spacing={1.25}>
              {accessData.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">Tidak ada akses aktif untuk user ini.</Typography>
                </Paper>
              ) : (
                accessData.map((access) => (
                  <Paper
                    key={access.id}
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.error.main, 0.02),
                      borderColor: alpha(theme.palette.error.main, 0.12)
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {access.submenu?.name || access.nmsubmenu || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {access.menu?.name || access.menu?.title || '-'}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {PERMISSION_KEYS.map((p) => {
                          const active = access[p.key] === 'Y';
                          if (!active) return null;
                          return (
                            <Chip
                              key={p.key}
                              size="small"
                              color={p.color}
                              label={p.short}
                              sx={{ height: 22, fontWeight: 700, fontSize: 11 }}
                            />
                          );
                        })}
                        {!countActivePerms(access) && (
                          <Chip size="small" variant="outlined" label="Tanpa flag" sx={{ height: 22 }} />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <CardActions sx={{ px: 0, justifyContent: 'flex-end' }}>
              <Button
                component={Link}
                href="/user-access"
                variant="outlined"
                color="secondary"
                startIcon={<ArrowLeft size={16} />}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                onClick={onSubmitHandle}
                variant="contained"
                color="error"
                disabled={submitting || accessData.length === 0}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Trash variant="Bold" size={18} />}
              >
                Hapus Semua Akses
              </Button>
            </CardActions>
          </Grid>
        </Grid>
      </MainCard>
    </Fragment>
  );
}
