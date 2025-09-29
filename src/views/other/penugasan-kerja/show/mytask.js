'use client';

import { Fragment, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Grid, Stack, CardActions, Chip } from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TickCircle, CloseCircle, HeartCircle, Save2, CloseSquare } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import ConfirmDialog from 'components/ConfirmDialog';

import InputForm from 'components/InputForm';
import InputRadio from 'components/InputRadio';
import InputAreaForm from 'components/InputAreaForm';
import InputDateTime from 'components/InputDateTime';
import OptionKaryawan from 'components/OptionKaryawan';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionEquipment from 'components/OptionEquipment';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionShiftKerja from 'components/OptionShiftKerja';

import { useShowPenugasanKerjaItems } from 'api/penugasan-kerja';
import useUser from 'hooks/useUser';
import { APP_DEFAULT_PATH } from 'config';
import axiosServices from 'utils/axios';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Penugasan Kerja', to: '/penugasan-kerja' },
  { title: 'Tugas Ku' }
];

export default function MyPenugasanKerja() {
  const user = useUser();
  const { id } = useParams();
  const { data: initialValues, dataLoading } = useShowPenugasanKerjaItems(id);
  console.log(initialValues);

  const validationSchema = Yup.object().shape({
    kode: Yup.string().required('Kode wajib diisi'),
    type: Yup.string().oneOf(['karyawan', 'equipment']).required('Tipe wajib diisi'),
    date_task: Yup.date().required('Tanggal tugas wajib diisi'),
    assigner_id: Yup.number().required('Pemberi tugas wajib diisi'),
    assigned_id: Yup.number().required('Penerima tugas wajib diisi'),
    narasitask: Yup.string().required('Narasi tugas wajib diisi'),
    status: Yup.string().oneOf(['active', 'done', 'rejected']),
    starttask: Yup.string()
      .matches(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, 'Format waktu mulai salah')
      .required('Waktu mulai wajib diisi'),
    finishtask: Yup.string()
      .matches(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, 'Format waktu selesai salah')
      .required('Waktu selesai wajib diisi')
  });

  const onSubmitHandle = () => {
    if (!['developer', 'administrator'].includes(user.role)) {
      alert('Anda tidak memiliki akses untuk mengubah tugas ini');
    } else {
      alert('Tugas berhasil dikirim');
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Tugas Ku" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/penugasan-kerja" />} content>
        {dataLoading ? (
          <div>Loading...</div>
        ) : (
          <Formik initialValues={initialValues} enableReinitialize validationSchema={validationSchema} onSubmit={onSubmitHandle}>
            {({ handleChange, handleSubmit, values, setFieldValue }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* === Data Umum === */}
                  <Grid item xs={12} sm={3}>
                    <InputForm readOnly name="kode" label="Kode" value={values.kode} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <InputForm readOnly type="date" name="date_task" label="Tanggal Task" value={values.date_task} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputRadio
                      name="type"
                      label="Type Penugasan"
                      value={values.type}
                      array={[
                        { value: 'equipment', teks: 'Equipment' },
                        { value: 'karyawan', teks: 'Karyawan' }
                      ]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <OptionKaryawan name="assigner_id" label="Assigner Task" value={values.assigner_id} setFieldValue={setFieldValue} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <OptionKaryawan name="assigned_id" label="Assigned To" value={values.assigned_id} setFieldValue={setFieldValue} />
                  </Grid>

                  {/* === Conditional Form === */}
                  {values.type === 'equipment' ? (
                    <Fragment>
                      <Grid item xs={12} sm={5} sx={{ mt: 2 }}>
                        <OptionPenyewa name="penyewa_id" label="Penyewa" value={values.penyewa_id} setFieldValue={setFieldValue} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <OptionEquipment name="equipment_id" label="Equipment" value={values.equipment_id} setFieldValue={setFieldValue} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <OptionShiftKerja name="shift_id" label="Shift Kerja" value={values.shift_id} setFieldValue={setFieldValue} />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <OptionKegiatanKerja
                          name="kegiatan_id"
                          label="Kegiatan"
                          value={values.kegiatan_id}
                          setFieldValue={setFieldValue}
                          searchParams={values.equipment ? { type: values.equipment.kategori } : ''}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <OptionLokasiKerja name="lokasi_id" label="Lokasi Kerja" value={values.lokasi_id} setFieldValue={setFieldValue} />
                      </Grid>
                    </Fragment>
                  ) : (
                    <Grid item xs={12}>
                      <InputAreaForm rows={6} label="Narasi Tugas" name="narasitask" value={values.narasitask} onChange={handleChange} />
                    </Grid>
                  )}

                  {/* === Waktu === */}
                  <Grid item xs={12} sm={6}>
                    <MainCard title="Waktu Penugasan">
                      <Grid container spacing={2} sx={{ minHeight: 175 }}>
                        <Grid item xs={12} sm={6}>
                          <InputDateTime name="starttask" label="Mulai Tugas" value={values.starttask} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <InputDateTime name="finishtask" label="Selesai Tugas" value={values.finishtask} onChange={handleChange} />
                        </Grid>
                        {values.checked_at && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <InputDateTime name="checked_at" label="Checked At" value={values.checked_at} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <InputDateTime
                                name={values.rejected_at ? 'rejected_at' : 'done_at'}
                                label={values.rejected_at ? 'Rejected At' : 'Done At'}
                                value={values.rejected_at || values.done_at}
                              />
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </MainCard>
                  </Grid>

                  {/* === Alasan & Status === */}
                  <Grid item xs={12} sm={6}>
                    <MainCard title="Keterangan Penolakan">
                      <InputAreaForm
                        rows={4}
                        label="Alasan Penolakan"
                        name="reject_msg"
                        value={values.reject_msg}
                        onChange={handleChange}
                      />
                      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                        <Chip label={values.checked_at ? 'Check' : 'New Task'} icon={<TickCircle />} color="secondary" />
                        {values.rejected_at && <Chip label="Reject" icon={<CloseCircle />} color="error" />}
                        {values.done_at && <Chip label="Finish" icon={<HeartCircle />} color="success" />}
                      </Stack>
                    </MainCard>
                  </Grid>
                </Grid>

                {/* === Aksi === */}
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button href="/penugasan-kerja" variant="outlined" color="secondary">
                    Batal
                  </Button>
                  <BtnActionTask values={values} />
                </CardActions>
              </Form>
            )}
          </Formik>
        )}
      </MainCard>
    </Fragment>
  );
}

const BtnActionTask = ({ values }) => {
  const route = useRouter();
  const [openDialog, setOpenDialog] = useState(false);

  const handleReject = async () => {
    if (!values.reject_msg) return alert('Alasan penolakan belum diisi');
    setOpenDialog(false);
    // TODO: lakukan aksi reject
    try {
      const resp = await axiosServices.post(`/api/operation/penugasan-kerja/${values.id}/tolak`, values);
      console.log(resp);
      if (resp.status == 201) {
        route.push('/penugasan-kerja');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAccept = async () => {
    try {
      const resp = await axiosServices.post(`/api/operation/penugasan-kerja/${values.id}/terima`, values);
      console.log(resp);
      if (resp.status == 201) {
        route.push('/penugasan-kerja');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleFinish = async () => {
    try {
      const resp = await axiosServices.post(`/api/operation/penugasan-kerja/${values.id}/selesai`, values);
      console.log(resp);
      if (resp.status == 201) {
        route.push('/penugasan-kerja');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderButton = () => {
    switch (values.status) {
      case 'active':
        return (
          <>
            <Button onClick={() => setOpenDialog(true)} variant="contained" color="error" startIcon={<CloseSquare />}>
              Tolak
            </Button>
            <Button onClick={handleAccept} variant="contained" startIcon={<Save2 />}>
              Terima
            </Button>
          </>
        );
      case 'check':
        return (
          <Button onClick={handleFinish} variant="contained" color="success" startIcon={<Save2 />}>
            Tugas Selesai
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ConfirmDialog
        open={openDialog}
        message="Apakah Anda yakin akan menolak tugas ini?"
        submessage="Pastikan Anda mengisi alasan penolakan."
        handleClose={() => setOpenDialog(false)}
        handleAction={handleReject}
      />
      <Stack direction="row" spacing={1}>
        {renderButton()}
      </Stack>
    </>
  );
};
