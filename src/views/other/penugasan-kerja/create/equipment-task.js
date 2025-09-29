'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from 'next/link';

import { Stack, Grid, Badge, Paper, Chip, CardActions, Button } from '@mui/material';

// THIRD - PARTY
import { Clipboard, Send2, Trash } from 'iconsax-react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup'; // ⬅ WAJIB
import moment from 'moment';

// COMPONENTS
import InputForm from 'components/InputForm';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionEquipment from 'components/OptionEquipment';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import InputAreaForm from 'components/InputAreaForm';
import InputDateTime from 'components/InputDateTime';
import OptionKaryawanMulti from 'components/OptionKaryawanMulti';
import OptionShiftKerja from 'components/OptionShiftKerja';

// HOOK
// import useUser from 'hooks/useUser';
import axiosServices from 'utils/axios';
import { saveRequest } from 'lib/offlineFetch';
import { openNotification } from 'api/notification';

export default function CreateEquipmentTask({ type }) {
  const route = useRouter();
  const initialValues = {
    type: type,
    date_task: moment().format('YYYY-MM-DD'),
    assigned_list: [],
    start_time: '',
    finish_time: '',
    penyewa_id: '',
    shift_id: '',
    lokasi_id: '',
    items: []
  };

  const validationSchema = Yup.object().shape({
    date_task: Yup.date().required('Tanggal task harus diisi'),

    assigned_list: Yup.array()
      .min(1, 'Minimal 1 karyawan harus dipilih')
      .of(
        Yup.object().shape({
          id: Yup.number().required('ID karyawan harus ada'),
          nama: Yup.string().required('Nama karyawan harus diisi'),
          section: Yup.string().required('Section harus diisi').oneOf(['driver', 'operator'], 'Section harus driver atau operator'),
          nik: Yup.string().required('NIK karyawan harus diisi')
        })
      )
      .required('Daftar penugasan harus diisi'),

    start_time: Yup.string()
      .required('Waktu mulai harus diisi')
      .test('valid-time', 'Format waktu harus DD-MM-YYYY HH:mm', (value) => moment(value, 'DD-MM-YYYY HH:mm', true).isValid()),

    finish_time: Yup.string()
      .required('Waktu selesai harus diisi')
      .test('valid-time', 'Format waktu harus DD-MM-YYYY HH:mm', (value) => moment(value, 'DD-MM-YYYY HH:mm', true).isValid())
      .test('after-start', 'Waktu selesai harus setelah waktu mulai', function (value) {
        const start = moment(this.parent.start_time, 'DD-MM-YYYY HH:mm');
        const finish = moment(value, 'DD-MM-YYYY HH:mm');
        return finish.isAfter(start);
      }),

    penyewa_id: Yup.number().required('Penyewa harus dipilih').min(1, 'Penyewa tidak valid'),

    shift_id: Yup.number().required('Shift harus dipilih').min(1, 'Shift tidak valid'),

    lokasi_id: Yup.number().required('Lokasi harus dipilih').min(1, 'Lokasi tidak valid'),

    items: Yup.array()
      .min(1, 'Minimal 1 item penugasan')
      .of(
        Yup.object().shape({
          karyawan_id: Yup.number().required('ID karyawan harus ada'),
          nmassigned: Yup.string().required('Nama penugasan harus diisi'),
          kegiatan_id: Yup.number().required('Kegiatan harus dipilih').min(1, 'Kegiatan tidak valid'),
          equipment_id: Yup.number().required('Equipment harus dipilih').min(1, 'Equipment tidak valid'),
          equipment: Yup.object().shape({
            id: Yup.number().required('ID equipment harus ada'),
            kode: Yup.string().required('Kode equipment harus diisi'),
            kategori: Yup.string().required('Kategori equipment harus diisi')
          })
        })
      )
      .required('Item penugasan harus diisi')
  });

  const onSubmitHandle = async (values) => {
    const config = {
      url: `/api/operation/penugasan-kerja/create`,
      method: 'POST',
      data: values,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      pesan: `INSERT PENUGASAN KERJA ${values.start_time}` // ✅ kirim pesan custom
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // offline → simpan ke queue
      await saveRequest(config);
      openNotification({
        open: true,
        title: 'Offline',
        message: 'Offline: data disimpan ke antrian',
        alert: {
          color: 'warning'
        }
      });
      return;
    }

    try {
      const resp = await axiosServices(config);
      console.log(resp);
      openNotification({
        open: true,
        title: 'Okey',
        message: 'Tugas berhasil dikirimkan...',
        alert: {
          color: 'success'
        }
      });
      route.push('/penugasan-kerja');
    } catch (error) {
      console.log(error);
      openNotification({
        open: true,
        title: 'Error',
        message: error.diagnostic.error,
        alert: {
          color: 'error'
        }
      });
    }
  };

  return (
    <Fragment>
      <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
        {({ errors, handleBlur, handleChange, handleSubmit, touched, values, setFieldValue }) => {
          console.log('values....', errors);

          return (
            <Form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
                <Grid item xs={12} sm={4}>
                  <InputForm
                    readOnly
                    label="Tanggal Task"
                    type="date"
                    name="date_task"
                    errors={errors}
                    touched={touched}
                    value={values.date_task}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <InputDateTime
                    name="start_time"
                    label="Estimasi Start Tugas"
                    value={values.start_time}
                    minDate={values.date_task}
                    errors={errors}
                    touched={touched}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <InputDateTime
                    name="finish_time"
                    label="Estimasi Finish Tugas"
                    value={values.finish_time}
                    minDate={values.date_task}
                    errors={errors}
                    touched={touched}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                </Grid>
                {values.type == 'equipment' ? (
                  <Grid item xs={12} sm={12} lg={12}>
                    <Grid container spacing={2} alignItems="flex-start" justifyContent="flex-start">
                      <Grid item xs={12} sm={12} lg={12}>
                        <OptionKaryawanMulti
                          value={values.assigned_list}
                          name="assigned_list"
                          label="Assigned To"
                          params={{ section: ['operator', 'driver'] }}
                          setFieldValue={(name, newVal) => {
                            // setFieldValue(name, newVal);
                            setFieldValue('assigned_list', newVal);

                            // Update items dari assigned_list
                            const newItems = newVal.map((k) => ({
                              karyawan_id: k.id,
                              assigned: k,
                              nmassigned: k.nama,
                              kegiatan_id: values.items.find((item) => item.karyawan_id === k.id)?.kegiatan_id || '',
                              equipment_id: values.items.find((item) => item.karyawan_id === k.id)?.equipment_id || '',
                              equipment: values.items.find((item) => item.karyawan_id === k.id)?.equipment || null
                            }));
                            setFieldValue('items', newItems);
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5} lg={5} sx={{ mt: 2 }}>
                        <OptionPenyewa
                          value={values.penyewa_id}
                          name={'penyewa_id'}
                          label="Penyewa"
                          error={errors.penyewa_id}
                          touched={touched.penyewa_id}
                          helperText={touched.penyewa_id && errors.penyewa_id}
                          setFieldValue={setFieldValue}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} lg={4}>
                        <OptionLokasiKerja
                          value={values.lokasi_id}
                          name={'lokasi_id'}
                          label="Lokasi Kerja"
                          error={errors.lokasi_id}
                          touched={touched.lokasi_id}
                          helperText={touched.lokasi_id && errors.lokasi_id}
                          setFieldValue={setFieldValue}
                        />
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <OptionShiftKerja
                          name="shift_id"
                          label="Shift Kerja"
                          value={values.shift_id}
                          error={errors.shift_id}
                          touched={touched.shift_id}
                          helperText={touched.shift_id && errors.shift_id}
                          setFieldValue={setFieldValue}
                        />
                      </Grid>
                    </Grid>
                    <FieldArray name="items">
                      {({ remove }) => {
                        return (
                          <Fragment>
                            {values.items.map((item, idx) => {
                              return (
                                <Paper key={idx} elevation={3} sx={{ my: 3, position: 'relative' }}>
                                  <div style={{ position: 'absolute' }}>
                                    <Badge badgeContent={idx + 1} color="primary">
                                      <Clipboard />
                                    </Badge>
                                  </div>
                                  <div style={{ position: 'absolute', right: -10, top: -10 }}>
                                    <Chip
                                      size="small"
                                      label="Hapus"
                                      onDelete={() => {
                                        remove(idx);
                                        setFieldValue(
                                          'assigned_list',
                                          values.assigned_list.filter((f) => f.id !== item.karyawan_id)
                                        );
                                      }}
                                      color="error"
                                      deleteIcon={<Trash style={{ fontSize: '1.15rem' }} />}
                                    />
                                  </div>
                                  <Stack justifyContent="space-between">
                                    <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start" sx={{ p: 2 }}>
                                      <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                                        <InputForm
                                          readOnly={true}
                                          errors={errors}
                                          touched={touched}
                                          type={'text'}
                                          label={'Ditugaskan Kepada'}
                                          name={'nmassigned'}
                                          placeholder={''}
                                          value={item.nmassigned}
                                          onBlur={handleBlur}
                                          onChange={handleChange}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={3}>
                                        <OptionEquipment
                                          label="Equipment"
                                          value={item.equipment_id}
                                          name={`items[${idx}].equipment_id`}
                                          objValue={`items[${idx}].equipment`}
                                          error={errors.items?.[idx]?.equipment_id} // Added optional chaining
                                          touched={touched.items?.[idx]?.equipment_id} // Added optional chaining
                                          helperText={touched.items?.[idx]?.equipment_id && errors.items?.[idx]?.equipment_id}
                                          setFieldValue={(name, value) => {
                                            // Update equipment_id dan equipment object
                                            setFieldValue(`items[${idx}].equipment_id`, value?.id || '');
                                            setFieldValue(`items[${idx}].equipment`, value || null);

                                            // Reset kegiatan_id jika equipment berubah
                                            setFieldValue(`items[${idx}].kegiatan_id`, '');
                                          }}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={5}>
                                        <OptionKegiatanKerja
                                          label="Kegiatan"
                                          value={item.kegiatan_id}
                                          name={`items[${idx}].kegiatan_id`}
                                          error={errors.items?.[idx]?.kegiatan_id} // Added optional chaining
                                          touched={touched.items?.[idx]?.kegiatan_id} // Added optional chaining
                                          helperText={touched.items?.[idx]?.kegiatan_id && errors.items?.[idx]?.kegiatan_id}
                                          setFieldValue={setFieldValue}
                                          searchParams={item.equipment ? { type: item.equipment.kategori } : ''}
                                        />
                                      </Grid>
                                    </Grid>
                                  </Stack>
                                </Paper>
                              );
                            })}
                          </Fragment>
                        );
                      }}
                    </FieldArray>
                  </Grid>
                ) : (
                  <Fragment>
                    <Grid item xs={12} sm={12} lg={12}>
                      <OptionKaryawanMulti
                        value={values.assigned_list}
                        name="assigned_list"
                        label="Assigned To"
                        // params={{ section: ['operator', 'driver'] }}
                        setFieldValue={(name, newVal) => {
                          // setFieldValue(name, newVal);
                          setFieldValue('items', []);
                          setFieldValue('assigned_list', newVal);
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={12} lg={12}>
                      <InputAreaForm
                        rows={6}
                        type={'text'}
                        label={'Narasi Tugas'}
                        name={'narasitask'}
                        placeholder={'Tuliskan keterangan atau narasi'}
                        touched={touched}
                        errors={errors}
                        value={values.narasitask}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Fragment>
                )}
              </Grid>

              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Stack spacing={1} direction="row">
                  <Button component={Link} href="/penugasan-kerja" variant="outlined" color="secondary">
                    Batal
                  </Button>
                  <Button type="submit" variant="contained" startIcon={<Send2 />}>
                    Kirim Tugas
                  </Button>
                </Stack>
              </CardActions>
            </Form>
          );
        }}
      </Formik>
    </Fragment>
  );
}
