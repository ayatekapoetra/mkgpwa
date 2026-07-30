'use client';

import { useRouter, useParams } from 'next/navigation';
import { Fragment } from 'react';
import Link from 'next/link';
import {
  Grid,
  Stack,
  Button,
  Typography,
  CardActions,
  Box,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { SecurityUser, ColorSwatch, Send2, Edit2 } from 'iconsax-react';
import { mutate } from 'swr';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import CircularLoader from 'components/CircularLoader';
import OptionUser from 'components/OptionUser';
import OptionSubmenuMulti from 'components/OptionSubmenuMulti';
import axiosServices from 'utils/axios';
import { saveRequest } from 'lib/offlineFetch';
import { openNotification } from 'api/notification';
import { endpoints, useShowUserAccess } from 'api/menu';
import PermissionMatrix from './PermissionMatrix';
import { defaultAccess, getInitials } from './permission-config';

const breadcrumbLinks = [
  { title: 'Home', to: '/' },
  { title: 'Setting', to: '#' },
  { title: 'User Access', to: '/user-access' },
  { title: 'Edit' }
];

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'User access berhasil diupdate...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const validationSchema = Yup.object({
  user_id: Yup.string().required('User karyawan wajib dipilih'),
  submenu: Yup.array().min(1, 'Minimal pilih satu submenu').required('Submenu wajib dipilih')
});

export default function ShowUserAccess() {
  const route = useRouter();
  const theme = useTheme();
  const { id } = useParams();
  const { data: existingAccess, dataLoading, dataError } = useShowUserAccess(id);

  const userName = existingAccess[0]?.user?.nmlengkap || existingAccess[0]?.nmuser || `User #${id}`;
  const userType = existingAccess[0]?.user?.usertype;

  const initialValues = {
    user_id: id || '',
    user: existingAccess[0]?.user || null,
    submenu: existingAccess.map((acc) => acc.submenu).filter(Boolean) || [],
    access:
      existingAccess.map((acc) => ({
        submenu: acc.submenu,
        read: acc.read || 'N',
        insert: acc.insert || 'N',
        update: acc.update || 'N',
        remove: acc.remove || 'N',
        accept: acc.accept || 'N',
        validate: acc.validate || 'N',
        approve: acc.approve || 'N'
      })) || [],
    sync_removed: true
  };

  const onSubmitHandle = async (values, { setSubmitting }) => {
    const config = {
      url: `/setting/akses-menu/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `UPDATE USER ACCESS ${values.user?.nmlengkap || values.user?.nama || userName}`
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      setSubmitting(false);
      return;
    }

    try {
      await axiosServices(config);
      mutate((key) => typeof key === 'string' && key.includes(endpoints.keySetting));
      route.push('/user-access');
      openNotification(msgSuccess);
    } catch (error) {
      openNotification({ ...msgError, message: error?.diagnostic?.error || 'Gagal mengirim data' });
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
      <Breadcrumbs custom heading="Edit User Access" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/user-access" />} content>
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${theme.palette.background.paper} 70%)`,
            borderColor: alpha(theme.palette.warning.main, 0.2)
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha(theme.palette.warning.main, 0.16),
                  color: 'warning.main',
                  fontWeight: 700
                }}
              >
                {getInitials(userName)}
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5">{userName}</Typography>
                  <Edit2 size={16} />
                </Stack>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                  {userType && <Chip size="small" label={userType} variant="outlined" />}
                  <Chip size="small" color="primary" label={`${existingAccess.length} menu aktif`} />
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ values, errors, touched, setFieldValue, handleSubmit, isSubmitting }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <OptionUser
                    label="User Karyawan"
                    name="user_id"
                    objField="user"
                    value={values.user_id}
                    error={errors.user_id}
                    touched={touched.user_id}
                    startAdornment={<SecurityUser />}
                    setFieldValue={setFieldValue}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <OptionSubmenuMulti
                    value={values.submenu}
                    name="submenu"
                    label="Submenu / Fitur"
                    error={errors.submenu}
                    touched={touched.submenu}
                    startAdornment={<ColorSwatch />}
                    setFieldValue={(_, newSubmenus) => {
                      const oldSubmenus = values.submenu;
                      const added = newSubmenus.filter((s) => !oldSubmenus.some((o) => o.id === s.id));
                      const removed = oldSubmenus.filter((o) => !newSubmenus.some((s) => s.id === o.id));

                      let newAccess = [...values.access];
                      added.forEach((submenuObj) => {
                        newAccess.push(defaultAccess(submenuObj));
                      });
                      removed.forEach((removedItem) => {
                        newAccess = newAccess.filter((acc) => acc.submenu?.id !== removedItem.id);
                      });

                      setFieldValue('submenu', newSubmenus);
                      setFieldValue('access', newAccess);
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <PermissionMatrix access={values.access} onChange={(next) => setFieldValue('access', next)} />
                </Grid>
                <Grid item xs={12}>
                  <CardActions sx={{ px: 0, justifyContent: 'flex-end' }}>
                    <Button component={Link} href="/user-access" variant="outlined" color="secondary" disabled={isSubmitting}>
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Send2 />}
                      disabled={isSubmitting}
                    >
                      Update Privilege
                    </Button>
                  </CardActions>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
