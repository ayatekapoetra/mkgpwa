'use client';

import { useRouter } from 'next/navigation';
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
  CircularProgress
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { SecurityUser, ColorSwatch, Send2, ShieldTick } from 'iconsax-react';
import { mutate } from 'swr';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionUser from 'components/OptionUser';
import OptionSubmenuMulti from 'components/OptionSubmenuMulti';
import axiosServices from 'utils/axios';
import { saveRequest } from 'lib/offlineFetch';
import { openNotification } from 'api/notification';
import { endpoints } from 'api/menu';
import PermissionMatrix from './PermissionMatrix';
import { defaultAccess } from './permission-config';

const breadcrumbLinks = [
  { title: 'Home', to: '/' },
  { title: 'Setting', to: '#' },
  { title: 'User Access', to: '/user-access' },
  { title: 'Create' }
];

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Akses user berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const initialValues = {
  user_id: '',
  user: null,
  submenu: [],
  access: []
};

const validationSchema = Yup.object({
  user_id: Yup.string().required('User karyawan wajib dipilih'),
  submenu: Yup.array().min(1, 'Minimal pilih satu submenu').required('Submenu wajib dipilih')
});

export default function CreateUserAccess() {
  const route = useRouter();
  const theme = useTheme();

  const onSubmitHandle = async (values, { setSubmitting }) => {
    const config = {
      url: `/setting/akses-menu/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT USER ACCESS ${values.user?.nmlengkap || values.user?.nama || ''}`
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

  return (
    <Fragment>
      <Breadcrumbs custom heading="Create User Access" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/user-access" />} content>
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${theme.palette.background.paper} 70%)`,
            borderColor: alpha(theme.palette.primary.main, 0.15)
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                color: 'primary.main'
              }}
            >
              <ShieldTick size={22} variant="Bold" />
            </Box>
            <Box>
              <Typography variant="h5">Tambah Privilege User</Typography>
              <Typography variant="body2" color="text.secondary">
                Pilih user, pilih submenu, lalu atur flag permission per menu.
              </Typography>
            </Box>
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
                    setFieldValue={(name, newSubmenus) => {
                      const oldSubmenus = values.submenu;
                      const added = newSubmenus.filter((s) => !oldSubmenus.some((o) => o.id === s.id));
                      const removed = oldSubmenus.filter((o) => !newSubmenus.some((s) => s.id === o.id));

                      let newAccess = [...values.access];
                      added.forEach((submenuObj) => {
                        newAccess.push(defaultAccess(submenuObj));
                      });
                      removed.forEach((removedItem) => {
                        newAccess = newAccess.filter((acc) => acc.submenu.id !== removedItem.id);
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
                      Simpan Privilege
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
