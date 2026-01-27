'use client';

import Link from 'next/link';
import { Fragment, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import moment from 'moment';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

// import Button from '@mui/material/Button';
import IconButton from 'components/@extended/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';

// PROJECT IMPORTS
import MainCard from 'components/MainCard';
import InputForm from 'components/InputForm';

// THIRD - PARTY
import {
  Building3,
  Android,
  Ankr,
  Arrow,
  AlignVertically,
  TruckFast,
  ArrowCircleLeft2,
  Timer1,
  Location,
  TimerPause,
  UserOctagon,
  GasStation,
  Send2,
  Trash,
  Back
} from 'iconsax-react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import OptionCabang from 'components/OptionCabang';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionEquipment from 'components/OptionEquipment';
import OptionMaterialMining from 'components/OptionMaterialMining';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import ConfirmDialog from 'components/ConfirmDialog';

import OptionKaryawan from 'components/OptionKaryawan';
import OfflineIndicator from 'components/OfflineIndicator';
import { openNotification } from 'api/notification';
import { useGetHEDailyTimesheet } from 'api/daily-timesheet';

const BASEURI = 'https://cdn.makkuragatama.id';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import CircularLoader from 'components/CircularLoader';
import ErrorBoundary from 'components/ErrorBoundary';
import axiosServices from 'utils/axios';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Timesheet berhasil diupdate...',
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
  { title: 'TimeSheet', to: '/timesheet' },
  { title: 'HE', to: '/timesheet' },
  { title: 'Show', to: '#' }
];

// ==============================|| SAMPLE PAGE ||============================== //

const ShowHETimesheetScreen = () => {
  const route = useRouter();
  const { id } = useParams();
  const { data: initData, dataLoading } = useGetHEDailyTimesheet(id);
  const [openDialog, setOpenDialog] = useState(false);

  const validationSchema = Yup.object().shape({
    date_ops: Yup.date().required('Tanggal wajib diisi'),
    site_id: Yup.string().required('Cabang wajib dipilih'),
    penyewa_id: Yup.string().required('Penyewa wajib dipilih'),
    mainact: Yup.string().oneOf(['mining', 'barging', 'rental'], 'Pilih salah satu aktivitas').required('Group Aktivitas wajib dipilih'),
    longshift: Yup.string().oneOf(['ls0', 'ls1', 'ls2'], 'Pilih salah satu status longshift').required('Status Longshift wajib diisi'),
    shift_id: Yup.string().oneOf(['1', '2'], 'Pilih shift yang tersedia').required('Shift kerja wajib dipilih'),
    karyawan_id: Yup.string().required('Operator / Driver wajib dipilih'),
    equipment_id: Yup.string().required('Kode Equipment wajib dipilih'),
    smustart: Yup.number().typeError('HM Start harus angka').required('HM Start wajib diisi'),
    smufinish: Yup.number()
      .typeError('HM Finish harus angka')
      .required('HM Finish wajib diisi')
      .min(Yup.ref('smustart'), 'HM Finish tidak boleh lebih kecil dari Start'),
    usedsmu: Yup.number().typeError('HM Used harus angka').required('HM Used wajib diisi'),
    bbm: Yup.number().typeError('Refuel BBM harus angka').min(0, 'Refuel BBM tidak boleh negatif').required('Refuel BBM wajib diisi'),
    kegiatan: Yup.array()
      .of(
        Yup.object().shape({
          kegiatan_id: Yup.string().nullable().required('Jenis kegiatan wajib dipilih'),
          material_id: Yup.string()
            .nullable()
            .when('$kategori', {
              is: 'HE',
              then: (schema) => schema.required('Material wajib diisi')
            }),
          lokasi_id: Yup.string().nullable().required('Lokasi wajib dipilih'),
          starttime: Yup.date().typeError('Waktu Start tidak valid').required('Waktu Start wajib diisi'),
          endtime: Yup.date()
            .typeError('Waktu Finish tidak valid')
            .min(Yup.ref('starttime'), 'Waktu Finish harus lebih besar dari Start')
            .required('Waktu Finish wajib diisi'),
          smustart: Yup.number().typeError('HM Start harus angka').required('HM Start wajib diisi'),
          smufinish: Yup.number()
            .typeError('HM Finish harus angka')
            .required('HM Finish wajib diisi')
            .min(Yup.ref('smustart'), 'HM Finish tidak boleh lebih kecil dari Start'),
          seq: Yup.string().required('SEQ wajib diisi')
        })
      )
      .min(1, 'Minimal satu kegiatan harus diisi')
  });

  const onsubmitHandle = async (values) => {
    try {
      const response = await axiosServices.post(`/operation/timesheet/${id}`, values);

      // Check if response indicates offline save
      if (response.status === 0 && response.message?.includes('offline')) {
        openNotification({
          open: true,
          title: 'info',
          message: 'Data disimpan secara offline. Akan disinkronkan saat koneksi tersedia.',
          alert: { color: 'info' }
        });
      } else {
        route.push('/timesheet');
        openNotification(msgSuccess);
      }
    } catch (error) {
      console.log(error);
      if (!navigator.onLine) {
        openNotification({
          open: true,
          title: 'info',
          message: 'Data disimpan secara offline. Akan disinkronkan saat koneksi tersedia.',
          alert: { color: 'info' }
        });
      } else {
        openNotification({ ...msgError, message: error?.diagnostic?.error || '...' });
      }
    }
  };

  // Standardize initData handling to prevent client-side exceptions
  const standardizedInitData = {
    date_ops: initData?.date_ops || '',
    site_id: initData?.site_id || initData?.cabang_id || '',
    penyewa_id: initData?.penyewa_id || '',
    mainact: initData?.mainact || initData?.activity || '',
    longshift: initData?.longshift || initData?.overtime || 'ls0',
    shift_id: initData?.shift_id || '',
    karyawan_id: initData?.karyawan_id || '',
    equipment_id: initData?.equipment_id || '',
    smustart: initData?.smustart || 0,
    smufinish: initData?.smufinish || 0,
    usedsmu: initData?.usedsmu || 0,
    bbm: initData?.bbm || 0,
    keterangan: initData?.keterangan || '',
    photo: initData?.photo || '',
    kegiatan: initData?.items || initData?.kegiatan || []
  };

  const toggleDialogHandle = () => {
    setOpenDialog(!openDialog);
  };

  const onRemoveHandle = async () => {
    setOpenDialog(!openDialog);
    try {
      const resp = await axiosServices.delete(`/operation/timesheet/${id}`);
      console.log('RESP.', resp);

      // Check if response indicates offline save
      if (resp.status === 0 && resp.message?.includes('offline')) {
        openNotification({
          open: true,
          title: 'info',
          message: 'Data akan dihapus saat koneksi tersedia.',
          alert: { color: 'info' }
        });
      } else {
        route.push('/timesheet');
        openNotification(msgSuccess);
      }
    } catch (error) {
      if (!navigator.onLine) {
        openNotification({
          open: true,
          title: 'info',
          message: 'Data akan dihapus saat koneksi tersedia.',
          alert: { color: 'info' }
        });
      } else {
        openNotification({ ...msgError, message: error?.diagnostic?.error || '...' });
      }
    }
  };

  if (dataLoading) {
    return <CircularLoader />;
  }

  return (
    <ErrorBoundary>
      <Fragment>
        <Breadcrumbs custom heading={'Show Daily Timesheet'} links={breadcrumbLinks} />
        <ConfirmDialog
          open={openDialog}
          message={
            <Stack>
              <Typography>{'Apakah anda yakin akan menghapus data ini ?'}</Typography>
              <Typography
                variant="body"
                component="pre" // agar whitespace dan newline terlihat
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                Data akan dihapus secara permanen dan tidak dapat diakses kembali
              </Typography>
            </Stack>
          }
          handleClose={() => setOpenDialog(false)}
          handleAction={onRemoveHandle}
        />
        <MainCard
          title={
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
              <Stack direction="row" alignItems="center" gap={1}>
                <IconButton color={'secondary'} onClick={() => route.back()}>
                  <ArrowCircleLeft2 />
                </IconButton>
                <Typography variant="subtitle1">Back</Typography>
              </Stack>
              <OfflineIndicator />
            </Stack>
          }
        >
          <Formik
            enableReinitialize={true}
            initialValues={standardizedInitData}
            validationSchema={validationSchema}
            onSubmit={onsubmitHandle}
          >
            {({ errors, handleChange, handleSubmit, touched, values, setFieldValue }) => {
              return (
                <Form noValidate onSubmit={handleSubmit}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <InputForm
                        label="Tanggal"
                        type="date"
                        name="date_ops"
                        errors={errors.date_ops}
                        touched={touched.date_ops}
                        value={moment(values?.date_ops).format('YYYY-MM-DD')}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <OptionCabang
                        value={values.site_id}
                        name={'site_id'}
                        label="Nama Cabang"
                        error={errors.site_id}
                        touched={touched.site_id}
                        startAdornment={<Building3 />}
                        helperText={touched.site_id && errors.site_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <OptionPenyewa
                        value={values.penyewa_id}
                        name={'penyewa_id'}
                        label="Nama Penyewa"
                        error={errors.penyewa_id}
                        touched={true}
                        startAdornment={<Android />}
                        helperText={true && errors.penyewa_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel id="activity-label">A Lokasi</InputLabel>
                        <Select
                          labelId="activity-label"
                          name="mainact"
                          value={values.mainact}
                          placeholder="Pilih"
                          onChange={handleChange}
                          input={
                            <OutlinedInput
                              startAdornment={
                                <InputAdornment position="start">
                                  <Location />
                                </InputAdornment>
                              }
                              label="Status Longshift"
                            />
                          }
                        >
                          <MenuItem value="">Pilih</MenuItem>
                          <MenuItem value={'mining'}>MINING</MenuItem>
                          <MenuItem value={'barging'}>BARGING</MenuItem>
                          <MenuItem value={'rental'}>RENTAL</MenuItem>
                          <MenuItem value={'explorasi'}>EXPLORASI</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={5} sx={{ mt: 2 }}>
                      <OptionKaryawan
                        label={'Operator'}
                        name={'karyawan_id'}
                        value={values.karyawan_id}
                        error={errors.karyawan_id}
                        touched={true}
                        startAdornment={<UserOctagon />}
                        helperText={true && errors.karyawan_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                      <OptionEquipment
                        value={values.equipment_id}
                        name={'equipment_id'}
                        label="Kode Equipemnt"
                        error={errors.equipment_id}
                        touched={true}
                        startAdornment={<TruckFast />}
                        helperText={true && errors.equipment_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <FormControl fullWidth touched={true} error={errors.shift_id}>
                        <InputLabel id="shift-label">Shift Kerja</InputLabel>
                        <Select
                          labelId="overtime-label"
                          name="shift_id"
                          value={values.shift_id || ''}
                          placeholder="Longshift"
                          onChange={handleChange}
                          input={
                            <OutlinedInput
                              startAdornment={
                                <InputAdornment position="start">
                                  <Timer1 />
                                </InputAdornment>
                              }
                              label="Shift Kerja"
                            />
                          }
                        >
                          <MenuItem value="">Pilih</MenuItem>
                          <MenuItem value={'1'}>Shift 1</MenuItem>
                          <MenuItem value={'2'}>Shift 2</MenuItem>
                        </Select>
                        {touched.shift_id && errors.shift_id && <FormHelperText>{errors.shift_id}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel id="overtime-label">Status Longshift</InputLabel>
                        <Select
                          labelId="overtime-label"
                          name="longshift"
                          value={values.longshift}
                          placeholder="Longshift"
                          onChange={handleChange}
                          input={
                            <OutlinedInput
                              startAdornment={
                                <InputAdornment position="start">
                                  <Timer1 />
                                </InputAdornment>
                              }
                              label="Status Longshift"
                            />
                          }
                        >
                          <MenuItem value="">Pilih</MenuItem>
                          <MenuItem value={'ls0'}>Tidak Longshift</MenuItem>
                          <MenuItem value={'ls1'}>Longshift 1</MenuItem>
                          <MenuItem value={'ls2'}>Longshift 2</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <InputForm
                        label="Refuel BBM"
                        type="number"
                        name={'bbm'}
                        startAdornment={<GasStation />}
                        errors={errors}
                        touched={touched}
                        value={values.bbm}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <InputForm
                        label="HM Start"
                        type="text"
                        name="smustart"
                        errors={errors}
                        touched={touched}
                        value={values.smustart}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <InputForm
                        label="HM Finish"
                        type="text"
                        name="smufinish"
                        errors={errors}
                        touched={touched}
                        value={values.smufinish}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                      <InputForm
                        label="HM Used"
                        type="number"
                        name="usedsmu"
                        error={errors.usedsmu}
                        touched={touched.usedsmu}
                        value={values.usedsmu}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Stack xs={12} sm={12} sx={{ mx: 2, mt: 2 }}>
                      <Typography variant="h5">Details Kegiatan</Typography>
                    </Stack>
                    <FieldArray name="kegiatan">
                      {() => (
                        <>
                          {values.kegiatan?.map((item, idx) => {
                            return (
                              <Paper key={idx} sx={{ my: 1, ml: 1, p: 2, width: '100%' }}>
                                <Grid container spacing={1} sx={{ alignItems: 'center' }}>
                                  <Grid item xs={12} sm={5}>
                                    <OptionKegiatanKerja
                                      value={item.kegiatan_id}
                                      label={'Jenis Kegiatan'}
                                      name={`kegiatan[${idx}].kegiatan_id`}
                                      searchParams={{ type: 'HE', isUniq: 'Y' }}
                                      error={touched.kegiatan?.[idx]?.kegiatan_id && Boolean(errors.kegiatan?.[idx]?.kegiatan_id)}
                                      startAdornment={<Arrow />}
                                      setFieldValue={setFieldValue}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={3}>
                                    <OptionMaterialMining
                                      value={item.material_id}
                                      label={'Jenis Material'}
                                      name={`kegiatan[${idx}].material_id`}
                                      error={touched.kegiatan?.[idx]?.material_id && Boolean(errors.kegiatan?.[idx]?.material_id)}
                                      startAdornment={<Ankr />}
                                      setFieldValue={setFieldValue}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={3}>
                                    <OptionLokasiKerja
                                      value={item.lokasi_id}
                                      label="Lokasi Awal"
                                      name={`kegiatan[${idx}].lokasi_id`}
                                      error={touched.kegiatan?.[idx]?.lokasi_id && Boolean(errors.kegiatan?.[idx]?.lokasi_id)}
                                      startAdornment={<AlignVertically />}
                                      setFieldValue={setFieldValue}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                                    <InputForm
                                      label="SEQ"
                                      type="text"
                                      name={`kegiatan[${idx}].seq`}
                                      error={touched.kegiatan?.[idx]?.seq && Boolean(errors.kegiatan?.[idx]?.seq)}
                                      value={item.seq}
                                      onChange={handleChange}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                                    <InputForm
                                      name={`kegiatan[${idx}].starttime`}
                                      label="Job Start"
                                      type="datetime-local"
                                      value={moment(item.starttime).format('YYYY-MM-DDTHH:mm')}
                                      onChange={handleChange}
                                      touched={touched.kegiatan?.[idx]?.starttime}
                                      errors={errors.kegiatan?.[idx]?.starttime}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                                    <InputForm
                                      label="Job Finish"
                                      type="datetime-local"
                                      name={`kegiatan[${idx}].endtime`}
                                      error={touched.kegiatan?.[idx]?.endtime && Boolean(errors.kegiatan?.[idx]?.endtime)}
                                      value={moment(item.endtime).format('YYYY-MM-DDTHH:mm')}
                                      onChange={handleChange}
                                      touched={touched.kegiatan?.[idx]?.endtime}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                                    <InputForm
                                      label="Work Hours"
                                      type="text"
                                      endAdornment={<TimerPause />}
                                      name={`kegiatan[${idx}].timetot`}
                                      error={touched.kegiatan?.[idx]?.timetot && Boolean(errors.kegiatan?.[idx]?.timetot)}
                                      value={item.timetot}
                                      readOnly
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                                    <InputForm
                                      label="HM Start"
                                      type="text"
                                      name={`kegiatan[${idx}].smustart`}
                                      error={touched.kegiatan?.[idx]?.smustart && Boolean(errors.kegiatan?.[idx]?.smustart)}
                                      value={item.smustart}
                                      onChange={handleChange}
                                      touched={touched.kegiatan?.[idx]?.smustart}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                                    <InputForm
                                      label="HM Finish"
                                      type="text"
                                      name={`kegiatan[${idx}].smufinish`}
                                      error={touched.kegiatan?.[idx]?.smufinish && Boolean(errors.kegiatan?.[idx]?.smufinish)}
                                      value={item.smufinish}
                                      onChange={handleChange}
                                      touched={touched.kegiatan?.[idx]?.smufinish}
                                    />
                                  </Grid>
                                </Grid>
                              </Paper>
                            );
                          })}
                        </>
                      )}
                    </FieldArray>

                    <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
                      <Paper elevation={2} sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                        <Card sx={{ width: '100%' }}>
                          <CardMedia
                            component="img"
                            src={`${BASEURI}/${values.photo || 'not-available.png'}`}
                            alt="Paella dish"
                            sx={{
                              width: '100%',
                              height: 'auto', // biar responsive sesuai ratio
                              objectFit: 'contain', // full gambar, tidak terpotong
                              objectPosition: 'center',
                              backgroundColor: '#f5f5f5' // opsional biar rapi
                            }}
                          />
                        </Card>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <IconButton variant="contained" color="error" onClick={toggleDialogHandle}>
                          <Trash />
                        </IconButton>
                        <Stack direction="row" gap={1}>
                          <Button component={Link} href={'/timesheet'} variant="outlined" color="secondary" startIcon={<Back />}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="shadow" startIcon={<Send2 />}>
                            Update Data
                          </Button>
                        </Stack>
                      </Stack>
                    </Grid>
                  </Grid>
                </Form>
              );
            }}
          </Formik>
        </MainCard>
      </Fragment>
    </ErrorBoundary>
  );
};

export default ShowHETimesheetScreen;
