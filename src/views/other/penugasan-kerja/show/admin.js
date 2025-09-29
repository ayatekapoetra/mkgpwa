'use client';

import { Fragment, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from 'next/link';

import { Box, Stack, Grid, Chip, CardActions, Button } from '@mui/material';

// THIRD - PARTY
import { TickCircle, CloseCircle, HeartCircle, Save2, Trash } from 'iconsax-react';
import LoadingButton from 'components/@extended/LoadingButton';
import { Formik, Form } from 'formik';
import * as Yup from 'yup'; // ⬅ WAJIB

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import { useShowPenugasanKerjaItems } from 'api/penugasan-kerja';
import InputForm from 'components/InputForm';
import InputRadio from 'components/InputRadio';
import OptionKaryawan from 'components/OptionKaryawan';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionEquipment from 'components/OptionEquipment';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import InputAreaForm from 'components/InputAreaForm';
import InputDateTime from 'components/InputDateTime';
import ConfirmDialog from 'components/ConfirmDialog';

// HOOK
import useUser from 'hooks/useUser';
import OptionShiftKerja from 'components/OptionShiftKerja';
import axiosServices from 'utils/axios';

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Penugasan Kerja', to: '/penugasan-kerja' }, { title: 'Show' }];

export default function UpdatePenugasanKerja() {
  const user = useUser();
  const route = useRouter();
  const { id } = useParams();
  const [openDialog, setOpenDialog] = useState(false);
  const { data: initialValues, dataLoading } = useShowPenugasanKerjaItems(id);
  console.log('initialValues.', initialValues);

  const validationSchema = Yup.object().shape({
    kode: Yup.string().required('Kode wajib diisi'),
    type: Yup.string().oneOf(['karyawan', 'alat']).required('Tipe wajib diisi'),
    date_task: Yup.date().required('Tanggal tugas wajib diisi'),
    assigner_id: Yup.number().required('Pemberi tugas wajib diisi'),
    assigned_id: Yup.number().required('Penerima tugas wajib diisi'),
    status: Yup.string().oneOf(['active', 'done', 'rejected']).required('Status wajib diisi'),
    starttask: Yup.string()
      .matches(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, 'Format waktu mulai salah (contoh: 21-03-2025 11:36)')
      .required('Waktu mulai wajib diisi'),
    finishtask: Yup.string()
      .matches(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, 'Format waktu selesai salah (contoh: 23-03-2025 11:36)')
      .required('Waktu selesai wajib diisi'),

    shift_id: Yup.number().nullable(),
    equipment_id: Yup.number().nullable(),
    kegiatan_id: Yup.number().nullable(),
    penyewa_id: Yup.number().nullable(),
    lokasi_id: Yup.number().nullable(),
    narasitask: Yup.string().required('Narasi tugas wajib diisi')
  });

  const openRemoveConfirmationHandle = () => setOpenDialog(true);
  const closeRemoveConfirmationHandle = () => setOpenDialog(false);

  const onSubmitHandle = async (values) => {
    // Implementasi submit
    if (!['developer', 'administrator'].includes(user.role)) {
      alert('bukan file anda...');
    } else {
      try {
        const resp = await axiosServices.post(`/api/operation/penugasan-kerja/${id}/update`, values);
        console.log(resp);
        if (resp.status == 201) {
          route.push('/penugasan-kerja');
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const onRemoveHandle = async () => {
    if (!['developer', 'administrator'].includes(user.role)) {
      alert('bukan file anda...');
    } else {
      try {
        const resp = await axiosServices.post(`/api/operation/penugasan-kerja/${id}/destroy`, {});
        console.log(resp);
        if (resp.status == 201) {
          route.push('/penugasan-kerja');
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Show Tugas Kerja'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/penugasan-kerja'} />} secondary={dataLoading && <div>Loading...</div>} content={true}>
        {!dataLoading && (
          <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
            {({ errors, handleBlur, handleChange, handleSubmit, touched, values, setFieldValue }) => {
              console.log('values....', values);

              return (
                <Form noValidate onSubmit={handleSubmit}>
                  <ConfirmDialog
                    open={openDialog}
                    message="Apakah anda yakin akan menghapus data ini ?"
                    handleClose={closeRemoveConfirmationHandle}
                    handleAction={onRemoveHandle}
                  />
                  <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
                    <Grid item xs={12} sm={3} lg={3}>
                      <InputForm
                        readOnly
                        label="Kode"
                        type="text"
                        name="kode"
                        placeholder="Kode"
                        errors={errors}
                        touched={touched}
                        value={values.kode}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3} lg={3}>
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
                    <Grid item xs={12} sm={6} lg={6}>
                      <InputRadio
                        name="type"
                        label="Type Penugasan"
                        value={values.type}
                        onChange={handleChange}
                        array={[
                          { value: 'equipment', teks: 'Equipment' },
                          { value: 'karyawan', teks: 'Karyawan' }
                        ]}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={6}>
                      <OptionKaryawan value={values.assigner_id} name={'assigner_id'} label="Assigner Task" setFieldValue={setFieldValue} />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={6}>
                      <OptionKaryawan value={values.assigned_id} name={'assigned_id'} label="Assigned To" setFieldValue={setFieldValue} />
                    </Grid>
                    {values.type == 'equipment' ? (
                      <Fragment>
                        <Grid item xs={12} sm={5} lg={5} sx={{ mt: 2 }}>
                          <OptionPenyewa value={values.penyewa_id} name={'penyewa_id'} label="Penyewa" setFieldValue={setFieldValue} />
                        </Grid>
                        <Grid item xs={12} sm={4} lg={4}>
                          <OptionEquipment
                            value={values.equipment_id}
                            name={'equipment_id'}
                            label="Equipment"
                            setFieldValue={setFieldValue}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <OptionShiftKerja name="shift_id" label="Shift Kerja" value={values.shift_id} setFieldValue={setFieldValue} />
                        </Grid>
                        <Grid item xs={12} sm={8} lg={8}>
                          <OptionKegiatanKerja
                            value={values.kegiatan_id}
                            name={'kegiatan_id'}
                            label="Kegiatan"
                            searchParams={values.equipment ? { type: values.equipment.kategori } : ''}
                            setFieldValue={setFieldValue}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} lg={4}>
                          <OptionLokasiKerja
                            value={values.lokasi_id}
                            name={'lokasi_id'}
                            label="Lokasi Kerja"
                            setFieldValue={setFieldValue}
                          />
                        </Grid>
                      </Fragment>
                    ) : (
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
                    )}
                    <Grid item xs={12} sm={6} lg={6}>
                      <MainCard title="Waktu Penugasan" sx={{ height: '100%' }}>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6} lg={6} sx={{ mb: 2 }}>
                            <InputDateTime
                              name="starttask"
                              label="Estimasi Start Tugas"
                              value={values.starttask}
                              errors={errors}
                              touched={touched}
                              onBlur={handleBlur}
                              onChange={handleChange}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} lg={6} sx={{ mb: 2 }}>
                            <InputDateTime
                              name="finishtask"
                              label="Estimasi Finish Tugas"
                              value={values.finishtask}
                              errors={errors}
                              touched={touched}
                              onBlur={handleBlur}
                              onChange={handleChange}
                            />
                          </Grid>
                          {values.checked_at ? (
                            <Fragment>
                              <Grid item xs={12} sm={6} lg={6} sx={{ mb: 2 }}>
                                <InputDateTime
                                  name="checked_at"
                                  label="Checked At"
                                  value={values.checked_at}
                                  errors={errors}
                                  touched={touched}
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6} lg={6} sx={{ mb: 2 }}>
                                {values.rejected_at ? (
                                  <InputDateTime
                                    name="rejected_at"
                                    label="Rejected At"
                                    value={values.rejected_at}
                                    errors={errors}
                                    touched={touched}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                ) : (
                                  <InputDateTime
                                    name="done_at"
                                    label="Done At"
                                    value={values.done_at}
                                    errors={errors}
                                    touched={touched}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                )}
                              </Grid>
                            </Fragment>
                          ) : (
                            <Grid item xs={12} sm={12} lg={12} sx={{ mt: 2 }}>
                              <Box display="flex" justifyContent="center" alignItems="center">
                                <LoadingButton loading variant="contained" loadingPosition="start" startIcon={<TickCircle />}>
                                  Menunggu Konfirmasi via apps...
                                </LoadingButton>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </MainCard>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={6}>
                      <MainCard sx={{ height: '100%' }}>
                        <InputAreaForm
                          rows={6}
                          type={'text'}
                          label={'Alasan Penolakan'}
                          name={'reject_msg'}
                          placeholder={'Tuliskan keterangan atau narasi'}
                          touched={touched}
                          errors={errors}
                          value={values.reject_msg}
                          onChange={handleChange}
                        />
                        <Stack
                          direction="row"
                          sx={{
                            mt: 1,
                            flexWrap: 'wrap', // ini penting agar Chip bisa pindah ke baris berikutnya
                            gap: 1
                          }}
                        >
                          {values.checked_at ? (
                            <Chip icon={<TickCircle variant="Bold" />} color="info" label="Check" />
                          ) : (
                            <Chip icon={<TickCircle variant="Bold" />} color="secondary" label="New Task" />
                          )}
                          {values.rejected_at && <Chip icon={<CloseCircle variant="Bold" />} color="error" label="Reject" />}
                          {values.done_at && <Chip icon={<HeartCircle variant="Bulk" color="#f47373" />} color="success" label="Finish" />}
                        </Stack>
                      </MainCard>
                    </Grid>
                  </Grid>
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Button onClick={openRemoveConfirmationHandle} color="error" variant="contained" startIcon={<Trash />}>
                      Hapus
                    </Button>
                    <Stack spacing={1} direction="row">
                      <Button component={Link} href="/penugasan-kerja" variant="outlined" color="secondary">
                        Batal
                      </Button>
                      <Button type="submit" variant="contained" startIcon={<Save2 />}>
                        Update
                      </Button>
                    </Stack>
                  </CardActions>
                </Form>
              );
            }}
          </Formik>
        )}
      </MainCard>
    </Fragment>
  );
}
