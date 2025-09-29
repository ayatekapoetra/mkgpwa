'use client';

import { Fragment } from 'react';
import { Link } from 'next/link';
import { useRouter } from 'next/navigation';
import { Stack, Grid, Badge, Paper, CardActions, Button } from '@mui/material';

// THIRD - PARTY
import { Clipboard, Send2, Trash, Add } from 'iconsax-react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';

// COMPONENTS
import InputForm from 'components/InputForm';
import InputAreaForm from 'components/InputAreaForm';
import InputDateTime from 'components/InputDateTime'; // Anda perlu komponen InputDateTime untuk format HH:mm
import DropZoneFormik from 'components/DropZoneFormik';
import OptionKaryawan from 'components/OptionKaryawan';
import IconButton from 'components/@extended/IconButton';

// HOOK
import axiosServices from 'utils/axios';
import { saveRequest } from 'lib/offlineFetch';
import { openNotification } from 'api/notification';
import OptionShiftKerja from 'components/OptionShiftKerja';

const initialValues = {
  type: 'karyawan',
  date_task: moment().format('YYYY-MM-DD'),
  assigned_id: '',
  shift_id: 1,
  lampiran: null,
  items: [{ assigned_id: '', narasitask: '', start_time: '', finish_time: '' }]
};

export default function CreateEmployeeTask() {
  const route = useRouter();

  const validationSchema = Yup.object().shape({
    type: Yup.string().required('Jenis tugas harus diisi').oneOf(['karyawan'], 'Jenis tugas tidak valid'),

    date_task: Yup.date().required('Tanggal tugas harus diisi').min(moment().startOf('day'), 'Tanggal tidak boleh kurang dari hari ini'),

    assigned_id: Yup.string().required('Karyawan harus dipilih'),

    shift_id: Yup.number().required('Shift harus dipilih').min(1, 'Shift tidak valid'),

    lampiran: Yup.mixed()
      .nullable()
      .test('fileSize', 'File terlalu besar (maksimal 5MB)', (value) => !value || (value && value.size <= 5 * 1024 * 1024))
      .test(
        'fileType',
        'Format file tidak didukung',
        (value) =>
          !value ||
          (value &&
            [
              'image/jpeg',
              'image/png',
              'image/webp',
              'text/csv',
              'application/pdf',
              'application/zip',
              'application/x-rar-compressed',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ].includes(value.type))
      ),

    items: Yup.array()
      .min(1, 'Minimal harus ada 1 tugas')
      .of(
        Yup.object().shape({
          narasitask: Yup.string().required('Deskripsi tugas harus diisi').max(500, 'Maksimal 500 karakter'),

          start_time: Yup.string()
            .required('Waktu mulai harus diisi')
            .test('valid-time', 'Format waktu harus DD-MM-YYYY HH:mm', (value) => moment(value, 'DD-MM-YYYY HH:mm', true).isValid()),

          finish_time: Yup.string()
            .required('Waktu selesai harus diisi')
            .test('valid-time', 'Format waktu harus DD-MM-YYYY HH:mm', (value) => moment(value, 'DD-MM-YYYY HH:mm', true).isValid())
            .test('after-start', 'Waktu selesai harus setelah waktu mulai', function (value) {
              const startTime = moment(this.parent.start_time, 'DD-MM-YYYY HH:mm');
              const finishTime = moment(value, 'DD-MM-YYYY HH:mm');
              return finishTime.isAfter(startTime);
            })
        })
      )
  });

  const onSubmitHandle = async (values) => {
    const data = {
      ...values,
      items: values.items.map((m) => ({
        ...m,
        assigned_id: values.assigned_id,
        start_time: moment(m.start_time, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
        finish_time: moment(m.finish_time, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DD HH:mm')
      }))
    };

    const config = {
      url: `/api/operation/penugasan-kerja/create`,
      method: 'POST',
      data: data,
      headers: { 'Content-Type': 'multipart/form-data' },
      status: 'pending',
      pesan: `INSERT PENUGASAN KERJA EMPLOYEE ${values.date_task}` // ✅ kirim pesan custom
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // offline → simpan ke queue
      await saveRequest(config);
      openNotification({
        open: true,
        title: 'Offline',
        message: 'Offline: data disimpan ke antrian',
        alert: { color: 'warning' }
      });
      return;
    }

    try {
      const resp = await axiosServices(config);

      if (resp.status == 201) {
        openNotification({
          open: true,
          title: 'Success',
          message: 'Tugas berhasil dikirimkan',
          alert: { color: 'success' }
        });
      }
      route.push('/penugasan-kerja');
    } catch (error) {
      openNotification({
        open: true,
        title: 'Error',
        message: error.diagnostic?.error || 'Terjadi kesalahan',
        alert: { color: 'error' }
      });
    }
  };

  return (
    <Fragment>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
        {({ errors, touched, handleSubmit, values, setFieldValue }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InputForm
                    label="Tanggal Task"
                    type="date"
                    name="date_task"
                    errors={errors}
                    touched={touched}
                    value={values.date_task}
                    onChange={(e) => setFieldValue('date_task', e.target.value)}
                  />
                  <OptionShiftKerja
                    name="shift_id"
                    label="Shift Kerja"
                    value={values.shift_id}
                    error={errors.shift_id}
                    touched={touched.shift_id}
                    helperText={touched.shift_id && errors.shift_id}
                    setFieldValue={setFieldValue}
                  />
                  <OptionKaryawan
                    value={values.assigned_id}
                    name="assigned_id"
                    label="Assigner Task"
                    setFieldValue={setFieldValue}
                    error={touched.assigned_id && Boolean(errors.assigned_id)}
                    helperText={touched.assigned_id && errors.assigned_id}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DropZoneFormik name="lampiran" accept="*" label="Upload File Tugas" />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <>
                        {values.items.map((item, idx) => {
                          const isLast = idx === values.items.length - 1;
                          return (
                            <Paper key={idx} elevation={3} sx={{ mt: 3, px: 2, py: 3, position: 'relative' }}>
                              <Badge badgeContent={idx + 1} color="primary" sx={{ position: 'absolute', left: -10, top: -6 }}>
                                <Clipboard />
                              </Badge>

                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={5}>
                                  <InputDateTime
                                    label="Estimasi Start Tugas"
                                    name={`items[${idx}].start_time`}
                                    value={item.start_time}
                                    onChange={(e) => setFieldValue(`items[${idx}].start_time`, e.target.value)}
                                    error={touched.items?.[idx]?.start_time && Boolean(errors.items?.[idx]?.start_time)}
                                    helperText={touched.items?.[idx]?.start_time && errors.items?.[idx]?.start_time}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                  <InputDateTime
                                    label="Estimasi Finish Tugas"
                                    name={`items[${idx}].finish_time`}
                                    value={item.finish_time}
                                    onChange={(e) => setFieldValue(`items[${idx}].finish_time`, e.target.value)}
                                    error={touched.items?.[idx]?.finish_time && Boolean(errors.items?.[idx]?.finish_time)}
                                    helperText={touched.items?.[idx]?.finish_time && errors.items?.[idx]?.finish_time}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                  {isLast ? (
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        variant="contained"
                                        color="error"
                                        onClick={() => remove(idx)}
                                        disabled={values.items.length <= 1}
                                      >
                                        <Trash />
                                      </IconButton>
                                      <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<Add />}
                                        onClick={() =>
                                          push({ assigned_id: values.assigned_id, narasitask: '', start_time: '', finish_time: '' })
                                        }
                                      >
                                        Add
                                      </Button>
                                    </Stack>
                                  ) : (
                                    <Button variant="outlined" color="error" startIcon={<Trash />} onClick={() => remove(idx)}>
                                      Remove
                                    </Button>
                                  )}
                                </Grid>
                                <Grid item xs={12}>
                                  <InputAreaForm
                                    rows={6}
                                    label="Narasi Tugas"
                                    name={`items[${idx}].narasitask`}
                                    value={item.narasitask}
                                    onChange={(e) => setFieldValue(`items[${idx}].narasitask`, e.target.value)}
                                    error={touched.items?.[idx]?.narasitask && Boolean(errors.items?.[idx]?.narasitask)}
                                    helperText={touched.items?.[idx]?.narasitask && errors.items?.[idx]?.narasitask}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          );
                        })}
                      </>
                    )}
                  </FieldArray>
                </Grid>

                <Grid item xs={12}>
                  <CardActions>
                    <Button component={Link} href="/penugasan-kerja" variant="outlined" color="secondary">
                      Batal
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<Send2 />}>
                      Kirim Tugas
                    </Button>
                  </CardActions>
                </Grid>
              </Grid>
            </Form>
          );
        }}
      </Formik>
    </Fragment>
  );
}
