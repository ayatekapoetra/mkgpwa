'use client';

import { useRouter } from 'next/navigation';
import { Fragment } from 'react';
import Link from 'next/link';
import { Grid, Stack, Button, FormControlLabel, Switch, Typography, CardActions } from '@mui/material';

import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { SecurityUser, ColorSwatch, Send2 } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionUser from 'components/OptionUser';
import OptionSubmenuMulti from 'components/OptionSubmenuMulti';
import axiosServices from 'utils/axios';
import { saveRequest } from 'lib/offlineFetch';

// HOOK
import { openNotification } from 'api/notification';

const breadcrumbLinks = [
  { title: 'Home', to: '/' },
  { title: 'Permission', to: '#' },
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

const defaultAccess = (submenu) => ({
  submenu,
  read: 'N',
  insert: 'N',
  update: 'N',
  remove: 'N',
  accept: 'N',
  validate: 'N',
  approve: 'N'
});

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

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/setting/akses-menu/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT USER ACCESS ${values.user?.nama}` // ✅ kirim pesan custom
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // offline → simpan ke queue
      await saveRequest(config);
      openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
      return;
    }

    try {
      await axiosServices(config);
      route.push('/user-access');
      openNotification(msgSuccess);
    } catch (error) {
      console.log(error);
      openNotification({ ...msgError, message: error?.diagnostic?.error || 'Gagal mengirim data' });
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create User Access'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/user-access" />} content>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ values, errors, touched, setFieldValue, handleSubmit }) => {
            return (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
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
                </Grid>

                <FieldArray
                  name="submenu"
                  render={() => (
                    <>
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                          <OptionSubmenuMulti
                            value={values.submenu}
                            name="submenu"
                            label="Nama Menu"
                            error={errors.submenu}
                            touched={touched.submenu}
                            startAdornment={<ColorSwatch />}
                            setFieldValue={(name, newSubmenus) => {
                              const oldSubmenus = values.submenu;
                              const added = newSubmenus.filter((s) => !oldSubmenus.some((o) => o.id === s.id));
                              const removed = oldSubmenus.filter((o) => !newSubmenus.some((s) => s.id === o.id));

                              let newAccess = [...values.access];

                              // Tambah access untuk submenu baru
                              added.forEach((submenuObj) => {
                                newAccess.push(defaultAccess(submenuObj));
                              });

                              // Hapus access berdasarkan submenu yg dihapus
                              removed.forEach((removedItem) => {
                                newAccess = newAccess.filter((acc) => acc.submenu.id !== removedItem.id);
                              });

                              setFieldValue('submenu', newSubmenus);
                              setFieldValue('access', newAccess);
                            }}
                          />
                        </Grid>

                        {/* Render access per submenu */}
                        {values.access.map((access, idx) => {
                          return (
                            <Grid item xs={12} sm={4} key={access.submenu.id}>
                              <MainCard sx={{ height: '100%' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  Menu {access.submenu.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Option untuk memberikan akses
                                </Typography>
                                {Object.keys(defaultAccess({}))
                                  .filter((k) => k !== 'submenu')
                                  .map((key) => (
                                    <Stack key={`${access.submenu.id}-${key}`}>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={values.access[idx][key] === 'Y'}
                                            onChange={(e) => {
                                              const updated = [...values.access];
                                              updated[idx][key] = e.target.checked ? 'Y' : 'N';
                                              setFieldValue('access', updated);
                                            }}
                                            color="primary"
                                          />
                                        }
                                        label={key.toUpperCase()}
                                      />
                                    </Stack>
                                  ))}
                              </MainCard>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </>
                  )}
                />

                <Grid item xs={12} sx={{ mt: 3 }}>
                  <CardActions>
                    <Button component={Link} href="/user-access" variant="outlined" color="secondary">
                      Batal
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<Send2 />}>
                      Simpan
                    </Button>
                  </CardActions>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
