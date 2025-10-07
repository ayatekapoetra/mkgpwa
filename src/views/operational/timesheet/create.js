'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  OutlinedInput,
  MenuItem,
  Paper,
  Typography,
  Stack,
  CircularProgress
} from '@mui/material';
import IconButton from 'components/@extended/IconButton';

// THIRD - PARTY
import {
  Android,
  Building3,
  Speedometer,
  Calculator,
  Send2,
  Location,
  Timer1,
  UserOctagon,
  TruckFast,
  GasStation,
  Arrow,
  Ankr,
  AlignVertically,
  Trash,
  AddSquare,
  Clock,
  Back
} from 'iconsax-react';

import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup'; // ⬅ WAJIB
// import moment from 'moment';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import OptionCabang from 'components/OptionCabang';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionMaterialMining from 'components/OptionMaterialMining';
import InputForm from 'components/InputForm';
import axiosServices from 'utils/axios';
import { saveRequest } from 'lib/offlineFetch';

// HOOK
import { openNotification } from 'api/notification';
import OptionPenyewa from 'components/OptionPenyewa';
import moment from 'moment';
import OptionOperatorDriver from 'components/OptionOperatorDriver';
import OptionEquipment from 'components/OptionEquipment';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import PhotoDropZoneFormik from 'components/PhotoDropZoneFormik';

const msgSuccess = {
  open: true,
  title: 'success',
  message: 'Timesheet berhasil dibuat...',
  alert: { color: 'success' }
};
const msgError = {
  open: true,
  title: 'error',
  message: '',
  alert: { color: 'error' }
};

const breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Timesheet', to: '/timesheet' }, { title: 'Create' }];

const initialValues = {
  tanggal: moment().format('YYYY-MM-DD'),
  cabang_id: '',
  equipment_id: '',
  equipment: null,
  penyewa_id: '',
  penyewa: null,
  overtime: 'ls0',
  shift_id: '',
  karyawan_id: '',
  karyawan: null,
  activity: '',
  smustart: 0.0,
  smufinish: 0.0,
  usedsmu: 0.0,
  bbm: 0,
  keterangan: '',
  photo: '',
  kegiatan: [
    // {
    //     kegiatan_id: '',
    //     lokasi_id: '',
    //     lokasi_to: '',
    //     material_id: ''
    // }
  ]
};

export default function CreateTimesheet() {
  const route = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validationSchema = Yup.object().shape({
    tanggal: Yup.date().required('Tanggal wajib diisi'),

    cabang_id: Yup.string().required('Cabang wajib dipilih'),

    penyewa_id: Yup.string().required('Penyewa wajib dipilih'),

    activity: Yup.string().oneOf(['mining', 'barging', 'rental'], 'Pilih salah satu aktivitas').required('Group Aktivitas wajib dipilih'),

    overtime: Yup.string().oneOf(['ls0', 'ls1', 'ls2'], 'Pilih salah satu status longshift').required('Status Longshift wajib diisi'),

    shift_id: Yup.string().oneOf(['1', '2'], 'Pilih shift yang tersedia').required('Shift kerja wajib dipilih'),

    karyawan_id: Yup.string().required('Operator / Driver wajib dipilih'),

    equipment_id: Yup.string().required('Kode Equipment wajib dipilih'),

    smustart: Yup.number().typeError('HM/KM Start harus angka').required('HM/KM Start wajib diisi'),

    smufinish: Yup.number()
      .typeError('HM/KM Finish harus angka')
      .required('HM/KM Finish wajib diisi')
      .min(Yup.ref('smustart'), 'HM/KM Finish tidak boleh lebih kecil dari Start'),

    usedsmu: Yup.number().typeError('HM/KM Used harus angka').required('HM/KM Used wajib diisi'),

    bbm: Yup.number().typeError('Refuel BBM harus angka').min(0, 'Refuel BBM tidak boleh negatif').required('Refuel BBM wajib diisi'),

    keterangan: Yup.string().nullable(),

    photo: Yup.string().nullable(),

    kegiatan: Yup.array()
      .of(
        Yup.object().shape({
          kegiatan_id: Yup.string().nullable().required('Jenis kegiatan wajib dipilih'),

          material_id: Yup.string()
            .nullable()
            .when('$kategori', {
              is: 'DT',
              then: (schema) => schema.required('Material wajib diisi')
            }),

          lokasi_id: Yup.string().nullable().required('Lokasi wajib dipilih'),

          lokasi_to: Yup.string()
            .nullable()
            .when('$kategori', {
              is: 'DT',
              then: (schema) => schema.required('Lokasi tujuan wajib diisi')
            }),

          starttime: Yup.date()
            .typeError('Waktu Start tidak valid')
            .required('Waktu Start wajib diisi')
            .test('after-or-equal-tanggal', 'Waktu Start tidak boleh sebelum tanggal operational', function (value) {
              // ambil tanggal dari context Yup (lihat bagian Formik validate)
              const tanggalRoot =
                this.resolve?.(Yup.ref('$tanggal')) ?? (this.options && this.options.context && this.options.context.tanggal);

              if (!value || !tanggalRoot) return true; // skip kalau kosong atau tanggal tidak tersedia

              // helper: konversi ke YMD number (YYYYMMDD) untuk perbandingan tanpa jam
              const toYMD = (d) => {
                const dt = new Date(d);
                // validasi date
                if (Number.isNaN(dt.getTime())) return null;
                const y = dt.getFullYear();
                const m = dt.getMonth() + 1;
                const day = dt.getDate();
                return y * 10000 + m * 100 + day;
              };

              const startYMD = toYMD(value);
              const tanggalYMD = toYMD(tanggalRoot);

              if (startYMD === null || tanggalYMD === null) return true; // biarkan Yup tipeError menangani format

              return startYMD >= tanggalYMD;
            }),

          endtime: Yup.date()
            .typeError('Waktu Finish tidak valid')
            .min(Yup.ref('starttime'), 'Waktu Finish harus lebih besar dari Start')
            .required('Waktu Finish wajib diisi'),

          smustart: Yup.number()
            .typeError('HM Start harus angka')
            .when('$kategori', {
              is: 'HE',
              then: (schema) => schema.required('HM Start wajib diisi')
            }),

          smufinish: Yup.number()
            .typeError('HM Finish harus angka')
            .when('$kategori', {
              is: 'HE',
              then: (schema) =>
                schema.required('HM Finish wajib diisi').min(Yup.ref('smustart'), 'HM Finish tidak boleh lebih kecil dari Start')
            }),

          seq: Yup.string().required('SEQ wajib diisi'),

          ritase: Yup.string()
            .nullable()
            .when('$kategori', {
              is: 'DT',
              then: (schema) => schema.required('Ritase wajib diisi')
            })
        })
      )
      .min(1, 'Minimal satu kegiatan harus diisi')
      // 🔥 Cek tumpang tindih antar kegiatan
      .test('no-overlap', 'Kegiatan tidak boleh saling beririsan', function (kegiatanList) {
        if (!Array.isArray(kegiatanList)) return true;
        const sorted = [...kegiatanList].sort((a, b) => new Date(a.starttime) - new Date(b.starttime));

        for (let i = 0; i < sorted.length - 1; i++) {
          const currEnd = new Date(sorted[i].endtime);
          const nextStart = new Date(sorted[i + 1].starttime);

          if (currEnd > nextStart) {
            return this.createError({
              path: `kegiatan[${i + 1}].starttime`,
              message: 'Waktu kegiatan tumpang tindih dengan sebelumnya'
            });
          }
        }

        return true;
      })
  });
  const onSubmitHandle = async (values) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Append all form fields to FormData
      Object.keys(values).forEach(key => {
        if (key === 'photo' && values[key] instanceof File) {
          // Handle file upload
          formData.append('photo', values[key]);
        } else if (key === 'kegiatan') {
          // Handle array of activities
          formData.append(key, JSON.stringify(values[key]));
        } else {
          // Handle regular fields
          formData.append(key, values[key] || '');
        }
      });

      const config = {
        url: `/api/operation/timesheet/create`,
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        status: 'pending',
        pesan: `INSERT TIMESHEET TANGGAL ${values.tanggal} EQUIPMENT ${values?.equipment.abbr}` // ✅ kirim pesan custom
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // offline → simpan ke queue
        await saveRequest(config);
        openNotification({ ...msgError, message: 'Offline: data disimpan ke antrian' });
        return;
      }

      const resp = await axiosServices(config);
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('RESP.', resp);
      }
      route.push('/timesheet');
      openNotification(msgSuccess);
    } catch (err) {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('Submit error:', err);
      }
      openNotification({ ...msgError, message: typeof err?.diagnostic?.error === 'string' ? err?.diagnostic?.error : 'Gagal mengirim data' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Timesheet'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/timesheet'} />} secondary={null} content={true}>
        <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={validationSchema} onSubmit={onSubmitHandle}>
          {({ errors, handleChange, handleBlur, handleSubmit, touched, values, setFieldValue }) => {
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
              console.log('VALUES--', values);
              console.log('errors--', errors);
            }

            return (
              <Form noValidate onSubmit={handleSubmit} style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}>
                <HelperComponent values={values} setFieldValue={setFieldValue} />
                <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={3} sx={{ mb: 2 }}>
                    <InputForm
                      label="Tanggal"
                      type="date"
                      name="tanggal"
                      errors={errors.tanggal}
                      touched={touched.tanggal}
                      value={values.tanggal}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                    <OptionCabang
                      value={values.cabang_id}
                      name={'cabang_id'}
                      label="Nama Cabang"
                      error={errors.cabang_id}
                      touched={touched.cabang_id}
                      startAdornment={<Building3 />}
                      helperText={touched.cabang_id && errors.cabang_id}
                      setFieldValue={setFieldValue}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5} sx={{ mt: 2 }}>
                    <OptionPenyewa
                      value={values.penyewa_id}
                      name={'penyewa_id'}
                      label="Nama Penyewa"
                      error={errors.penyewa_id}
                      touched={touched.penyewa_id}
                      startAdornment={<Android />}
                      helperText={touched.penyewa_id && errors.penyewa_id}
                      setFieldValue={setFieldValue}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                    <FormControl fullWidth error={touched.activity && Boolean(errors.activity)}>
                      <InputLabel id="activity-label">Group Aktifitas</InputLabel>
                      <Select
                        labelId="activity-label"
                        name="activity"
                        value={values.activity}
                        placeholder="Pilih"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        disabled={isSubmitting}
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
                      </Select>
                      {touched.activity && errors.activity && <FormHelperText>{errors.activity}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <FormControl fullWidth>
                      <InputLabel id="overtime-label">Status Longshift</InputLabel>
                      <Select
                        labelId="overtime-label"
                        name="overtime"
                        value={values.overtime}
                        placeholder="Longshift"
                        onChange={handleChange}
                        disabled={isSubmitting}
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
                        <MenuItem value={'ls0'}>Tidak Longshift</MenuItem>
                        <MenuItem value={'ls1'}>Longshift 1</MenuItem>
                        <MenuItem value={'ls2'}>Longshift 2</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <FormControl
                      error={touched.shift_id && Boolean(errors.shift_id)} // << cek error>
                      fullWidth
                    >
                      <InputLabel id="shift-label">Shift Kerja</InputLabel>
                      <Select
                        labelId="overtime-label"
                        name="shift_id"
                        value={values.shift_id}
                        placeholder="Longshift"
                        onChange={handleChange}
                        disabled={isSubmitting}
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
                        <MenuItem value={'1'}>Shift 1</MenuItem>
                        <MenuItem value={'2'}>Shift 2</MenuItem>
                      </Select>
                      {touched.shift_id && errors.shift_id && <FormHelperText>{errors.shift_id}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <OptionOperatorDriver
                      label={'Operator / Driver'}
                      name={'karyawan_id'}
                      objValue={'karyawan'}
                      value={values.karyawan_id}
                      error={errors.karyawan_id}
                      touched={touched.karyawan_id}
                      startAdornment={<UserOctagon />}
                      helperText={touched.karyawan_id && errors.karyawan_id}
                      setFieldValue={setFieldValue}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <OptionEquipment
                      value={values.equipment_id}
                      name={'equipment_id'}
                      label="Kode Equipemnt"
                      error={errors.equipment_id}
                      touched={touched.equipment_id}
                      startAdornment={<TruckFast />}
                      helperText={touched.equipment_id && errors.equipment_id}
                      setFieldValue={setFieldValue}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InputForm
                      label="HM/KM Start"
                      type="text"
                      name="smustart"
                      placeholder="..."
                      startAdornment={<Speedometer />}
                      errors={errors}
                      touched={touched}
                      value={values.smustart}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InputForm
                      label="HM/KM Finish"
                      type="text"
                      name="smufinish"
                      placeholder="..."
                      startAdornment={<Speedometer />}
                      errors={errors}
                      touched={touched}
                      value={values.smufinish}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <InputForm
                      label="HM/KM Used"
                      type="number"
                      name="usedsmu"
                      startAdornment={<Calculator />}
                      error={errors.usedsmu}
                      touched={touched.usedsmu}
                      value={values.usedsmu}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <InputForm
                      label="Refuel BBM"
                      type="number"
                      name="bbm"
                      startAdornment={<GasStation />}
                      error={errors.bbm}
                      touched={touched.bbm}
                      value={values.bbm}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
                    <InputForm
                      label="Keterangan"
                      type="text"
                      name="keterangan"
                      error={errors.keterangan}
                      touched={touched.keterangan}
                      value={values.keterangan}
                      onChange={handleChange}
                      multiline
                      rows={10}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
                    <PhotoDropZoneFormik name="photo" disabled={isSubmitting} />
                  </Grid>
                </Grid>
                <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <FieldArray name="kegiatan">
                      {({ remove, push }) => (
                        <MainCard
                          title={<div>Detail Kegiatan</div>}
                          secondary={
                            <Button
                              onClick={() =>
                                push({
                                  kegiatan_id: '',
                                  lokasi_id: '',
                                  lokasi_to: '',
                                  material_id: '',
                                  starttime: '',
                                  endtime: ''
                                })
                              }
                              variant="contained"
                              color="secondary"
                              startIcon={<AddSquare />}
                              disabled={isSubmitting}
                            >
                              Kegiatan
                            </Button>
                          }
                          sx={{ p: 1 }}
                          content={false}
                        >
                          <div>
                            {values?.kegiatan.length == 0 && (
                              <Typography variant="h6" color="error" gutterBottom>
                                {typeof errors?.kegiatan === 'string' ? errors?.kegiatan : 'Minimal satu kegiatan harus diisi'}
                              </Typography>
                            )}
                          </div>
                          {values.kegiatan?.map((item, idx) => {
                            return (
                              <Paper key={idx} elevation={0} sx={{ p: 1, mt: 2 }}>
                                <Grid key={idx} container spacing={1}>
                                  <Grid item xs={12} sm={5}>
                                    <OptionKegiatanKerja
                                      value={item.kegiatan_id}
                                      label={'Jenis Kegiatan'}
                                      searchParams={
                                        values.equipment?.kategori == 'HE' ? { type: 'HE', isUniq: 'Y' } : { type: 'DT', isUniq: 'Y' }
                                      }
                                      name={`kegiatan[${idx}].kegiatan_id`}
                                      touched={touched.kegiatan?.[idx]?.kegiatan_id}
                                      error={touched.kegiatan?.[idx]?.kegiatan_id && Boolean(errors.kegiatan?.[idx]?.kegiatan_id)}
                                      startAdornment={<Arrow />}
                                      setFieldValue={setFieldValue}
                                    />
                                    {Boolean(errors.kegiatan?.[idx]?.kegiatan_id) && (
                                      <Typography variant="body2" color="error" gutterBottom>
                                        {errors.kegiatan?.[idx]?.kegiatan_id}
                                      </Typography>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <OptionMaterialMining
                                      value={item.material_id}
                                      label={'Jenis Material'}
                                      name={`kegiatan[${idx}].material_id`}
                                      touched={touched.kegiatan?.[idx]?.material_id}
                                      error={touched.kegiatan?.[idx]?.material_id && Boolean(errors.kegiatan?.[idx]?.material_id)}
                                      startAdornment={<Ankr />}
                                      setFieldValue={setFieldValue}
                                    />
                                    {Boolean(errors.kegiatan?.[idx]?.material_id) && (
                                      <Typography variant="body2" color="error" gutterBottom>
                                        {errors.kegiatan?.[idx]?.material_id}
                                      </Typography>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} sm={3}>
                                    <OptionLokasiKerja
                                      value={item.lokasi_id}
                                      label="Nama Lokasi"
                                      name={`kegiatan[${idx}].lokasi_id`}
                                      touched={touched.kegiatan?.[idx]?.lokasi_id}
                                      error={touched.kegiatan?.[idx]?.lokasi_id && Boolean(errors.kegiatan?.[idx]?.lokasi_id)}
                                      startAdornment={<AlignVertically />}
                                      setFieldValue={setFieldValue}
                                    />
                                    {Boolean(errors.kegiatan?.[idx]?.lokasi_id) && (
                                      <Typography variant="body2" color="error" gutterBottom>
                                        {errors.kegiatan?.[idx]?.lokasi_id}
                                      </Typography>
                                    )}
                                  </Grid>
                                  {values.equipment?.kategori == 'DT' && (
                                    <Grid item xs={12} sm={3}>
                                      <OptionLokasiKerja
                                        value={item.lokasi_to}
                                        label="Lokasi Tujuan"
                                        name={`kegiatan[${idx}].lokasi_to`}
                                        touched={touched.kegiatan?.[idx]?.lokasi_to}
                                        error={touched.kegiatan?.[idx]?.lokasi_to && Boolean(errors.kegiatan?.[idx]?.lokasi_to)}
                                        startAdornment={<AlignVertically />}
                                        setFieldValue={setFieldValue}
                                      />
                                    </Grid>
                                  )}
                                  <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                                    <InputForm
                                      name={`kegiatan[${idx}].starttime`}
                                      label="Waktu Start"
                                      type="datetime-local"
                                      startAdornment={<Clock />}
                                      value={item.starttime}
                                      onChange={handleChange}
                                      touched={touched.kegiatan?.[idx]?.starttime}
                                      errors={touched.kegiatan?.[idx]?.starttime && errors.kegiatan?.[idx]?.starttime}
                                    />
                                    {Boolean(errors.kegiatan?.[idx]?.starttime) && (
                                      <Typography variant="body2" color="error" gutterBottom>
                                        {errors.kegiatan?.[idx]?.starttime}
                                      </Typography>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                                    <InputForm
                                      label="Waktu Finish"
                                      type="datetime-local"
                                      name={`kegiatan[${idx}].endtime`}
                                      startAdornment={<Clock />}
                                      value={item.endtime}
                                      onChange={handleChange}
                                      error={touched.kegiatan?.[idx]?.endtime && Boolean(errors.kegiatan?.[idx]?.endtime)}
                                    />
                                    {Boolean(errors.kegiatan?.[idx]?.endtime) && (
                                      <Typography variant="body2" color="error" gutterBottom>
                                        {errors.kegiatan?.[idx]?.endtime}
                                      </Typography>
                                    )}
                                  </Grid>
                                  {values.equipment?.kategori == 'HE' && (
                                    <>
                                      <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                                        <InputForm
                                          name={`kegiatan[${idx}].smustart`}
                                          label="HM Start"
                                          type="number"
                                          startAdornment={<Speedometer />}
                                          value={item.smustart}
                                          onChange={handleChange}
                                          touched={touched.kegiatan?.[idx]?.smustart}
                                          errors={touched.kegiatan?.[idx]?.smustart && errors.kegiatan?.[idx]?.smustart}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                                        <InputForm
                                          label="HM Finish"
                                          type="number"
                                          name={`kegiatan[${idx}].smufinish`}
                                          value={item.smufinish}
                                          onChange={handleChange}
                                          startAdornment={<Speedometer />}
                                          error={touched.kegiatan?.[idx]?.smufinish && Boolean(errors.kegiatan?.[idx]?.smufinish)}
                                        />
                                      </Grid>
                                    </>
                                  )}
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
                                  {values.equipment?.kategori == 'DT' && (
                                    <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                                      <InputForm
                                        label="Ritase"
                                        type="text"
                                        name={`kegiatan[${idx}].ritase`}
                                        error={touched.kegiatan?.[idx]?.ritase && Boolean(errors.kegiatan?.[idx]?.ritase)}
                                        value={item.ritase}
                                        onChange={handleChange}
                                      />
                                    </Grid>
                                  )}
                                  <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                                    <IconButton
                                      variant="contained"
                                      color="error"
                                      size="large"
                                      onClick={() => remove(idx)}
                                      disabled={isSubmitting}
                                    >
                                      <Trash />
                                    </IconButton>
                                  </Grid>
                                </Grid>
                              </Paper>
                            );
                          })}
                        </MainCard>
                      )}
                    </FieldArray>
                  </Grid>
                  <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
                    <Stack direction="row" gap={1}>
                      <Button
                        component={Link}
                        href={'/timesheet'}
                        variant="outlined"
                        color="secondary"
                        startIcon={<Back />}
                        disabled={isSubmitting}
                        onClick={(e) => {
                          if (isSubmitting) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="shadow"
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Send2 />}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Mengirim...' : 'Kirim Timesheet'}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </MainCard>
    </Fragment>
  );
}

const HelperComponent = ({ values, setFieldValue }) => {
  useEffect(() => {
    if (values.smustart || values.smufinish) {
      var usedsmu = parseFloat(values.smufinish) - parseFloat(values.smustart);
      setFieldValue('usedsmu', usedsmu || 0);
    }
  }, [values, setFieldValue]);

  return null;
};
