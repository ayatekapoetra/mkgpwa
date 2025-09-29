'use client';

import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
import Image from 'next/image';
import moment from 'moment';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
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
  Trash,
  Android,
  Ankr,
  Arrow,
  AlignVertically,
  TruckFast,
  MessageQuestion,
  Scan,
  Timer1,
  Location,
  Send2,
  UserOctagon
} from 'iconsax-react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup'; // ⬅ WAJIB
import imageCompression from 'browser-image-compression';
import OptionCabang from 'components/OptionCabang';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionEquipment from 'components/OptionEquipment';
import OptionMaterialMining from 'components/OptionMaterialMining';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import ConfirmDialog from 'components/ConfirmDialog';

import useUser from 'hooks/useUser';
import OptionKaryawan from 'components/OptionKaryawan';
import { openNotification } from 'api/notification';
import axiosServices from 'utils/axios';

// ==============================|| SAMPLE PAGE ||============================== //

const initData = {
  tanggal: '',
  cabang_id: '',
  penyewa_id: '',
  equipment_id: '',
  driver_id: '',
  overtime: '',
  kmstart: 0.0,
  kmfinish: 0.0,
  bbm: 0,
  activity: '',
  penyewa_id: '',
  lokasi_id: '',
  shift_id: '',
  photo: null,
  kegiatan: []
};

const ScanDTTimesheetScreen = () => {
  // const route = useRouter()
  const users = useUser();
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [initialValues, setInitialValues] = useState(initData);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typeocr, setTypeocr] = useState('/api/upload/timesheet-dt/sensored-ocr-aws');
  const [formKey, setFormKey] = useState(Date.now()); // waktu sebagai key unik

  const validationSchema = Yup.object().shape({
    tanggal: Yup.date().required('Tanggal wajib diisi').typeError('Format tanggal tidak valid'),

    kmstart: Yup.string().required('KM Start wajib diisi'),
    kmfinish: Yup.string().required('KM Finish wajib diisi'),

    bbm: Yup.string().required('BBM wajib diisi').matches(/^\d+$/, 'BBM harus berupa angka'),

    equipment_id: Yup.string().required('ID Unit wajib diisi'),

    activity: Yup.string().required('Activity wajib diisi'),

    penyewa_id: Yup.number().typeError('Penyewa ID harus berupa angka').required('Penyewa ID wajib diisi'),

    driver_id: Yup.number().required('Nama driver tidak ditemukan'),

    shift_id: Yup.number().required('Shift kerja tidak ditemukan'),

    kegiatan: Yup.array()
      .of(
        Yup.object().shape({
          ctg: Yup.string().required('Kategori (ctg) wajib diisi'),

          lokasi_id: Yup.number().typeError('Lokasi ID harus berupa angka').required('Lokasi ID wajib diisi'),

          ritase: Yup.number().typeError('Ritase harus berupa angka').required('Ritase wajib diisi'),

          nama: Yup.string().required('Nama kegiatan wajib diisi'),

          start: Yup.string().required('Jam mulai wajib diisi'),

          finish: Yup.string().required('Jam selesai wajib diisi')
        })
      )
      .min(1, 'Minimal satu kegiatan harus diisi')
  });

  const openRemoveConfirmationHandle = () => setOpenDialog(true);
  const closeRemoveConfirmationHandle = () => setOpenDialog(false);

  const ambilGambarHandle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    // 👇 Kompres file
    const options = {
      maxSizeMB: 0.5, // Ukuran maksimal file setelah kompres (dalam MB)
      maxWidthOrHeight: 1000, // Resolusi maksimum
      useWebWorker: true
    };

    let compressedFile;
    try {
      compressedFile = await imageCompression(file, options);
      setImage(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Compression Error:', err);
      alert('Gagal memproses gambar.' + JSON.stringify(err, null, 2));
    }

    try {
      const formData = new FormData();
      formData.append('image', compressedFile);

      const res = await fetch(typeocr, {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      // console.log('RESULT.', result);

      setText(JSON.stringify(result?.data, null, 5) || 'Tidak ada teks terdeteksi');
      setInitialValues({
        ...result?.data,
        cabang_id: users.cabang_id,
        kmstart: result?.data.kmstart,
        kmfinish: result?.data.kmfinish,
        hmtotal: parseFloat(result?.data.kmfinish) - parseFloat(result?.data.kmstart),
        photo: compressedFile,
        kegiatan: result?.data?.kegiatan.map((item) => ({
          ...item,
          seq: item.seq,
          lokasi_id: item.lokasi_id,
          ritase: item.ritase,
          shift_id: parseInt(item.shift_id),
          start: moment(item.start, 'HHmm').format('HH:mm'),
          finish: moment(item.finish, 'HHmm').format('HH:mm')
        }))
      });

      // ⬇ Tambahkan ini untuk force re-mount Formik
      setFormKey(Date.now());
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = (setFieldValue, resetForm) => {
    resetForm();
    setImage(null);
    setText('');
    setFieldValue('bbm', '0');
    setFieldValue('kmstart', '0');
    setFieldValue('kmfinish', '0');
    setFieldValue('hmtotal', '0');
    setFieldValue('Tanggal', '');
    setFieldValue('shift_id', '');
    setFieldValue('overtime', '');
    setFieldValue('driver_id', '');
    setFieldValue('lokasi_id', '');
    setFieldValue('penyewa_id', '');
    setFieldValue('equipment_id', '');
    setFieldValue('kegiatan', []);
    // route.replace(route.asPath)
  };

  const onSubmitHandle = async (values, { resetForm }) => {
    try {
      const resp = await axiosServices.post('/api/operation/timesheet/create-ocr-dt', values, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (resp.status == 201) {
        resetForm();
        openNotification({
          open: true,
          title: 'Success',
          message: 'Timesheet berhasil dikirimkan',
          alert: { color: 'success' }
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.log(error);
      const localError = error.errors || 'Terjadi kesalahan';
      openNotification({
        open: true,
        title: 'Error',
        message: error.diagnostic?.error || localError,
        alert: { color: 'error' }
      });
    }
  };

  return (
    <MainCard title="Scan OCR Dumptruck">
      <ConfirmDialog
        open={openDialog}
        message={
          <Stack>
            <Typography>HASIL PARSING DATA OCR</Typography>
            <Typography
              variant="body"
              component="pre" // agar whitespace dan newline terlihat
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {text || 'Blum ada data'}
            </Typography>
          </Stack>
        }
        handleClose={closeRemoveConfirmationHandle}
        handleAction={openRemoveConfirmationHandle}
      />
      <Formik
        key={formKey} // penting!
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmitHandle}
      >
        {({ errors, handleChange, handleSubmit, touched, values, setFieldValue, resetForm }) => {
          console.log('VALUES---', values);
          // console.log('ERROR---', errors);
          // console.log('touched---', touched);

          return (
            <Form noValidate onSubmit={handleSubmit}>
              <HelperComponent values={values} setFieldValue={setFieldValue} />
              <Grid container spacing={1}>
                <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel id="typeocr-label">Type Scaning OCR</InputLabel>
                    <Select
                      labelId="typeocr-label"
                      name="typeocr"
                      value={typeocr}
                      placeholder="Metode Pembacaan"
                      onChange={(e) => setTypeocr(e.target.value)}
                      input={
                        <OutlinedInput
                          startAdornment={
                            <InputAdornment position="start">
                              <Scan />
                            </InputAdornment>
                          }
                          label="Metode Pembacaan"
                        />
                      }
                    >
                      <MenuItem value={'/api/upload/timesheet-dt/sensored-ocr-aws'} selected>
                        Ambil data yang disensor
                      </MenuItem>
                      {/* <MenuItem value={'/api/upload/timesheet-dt/unsensored-ocr-aws'}>Ambil data yang tidak disensor</MenuItem> */}
                    </Select>
                  </FormControl>
                </Grid>
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
                  />
                </Grid>
                <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
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
                      name="activity"
                      value={values.activity}
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
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                    <label htmlFor="upload-form">
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                        {image ? (
                          <Image
                            src={image}
                            alt="Deskripsi gambar"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <Image
                            src={'/assets/images/upload.png'}
                            alt="Deskripsi gambar"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            style={{ objectFit: 'contain' }}
                          />
                        )}
                      </div>
                    </label>
                    <input id="upload-form" type="file" accept="image/*" onChange={ambilGambarHandle} hidden />
                    {loading && <p>⏳ Sedang memproses OCR...</p>}
                  </Box>
                  <Stack direction="row" mt={1} spacing={1}>
                    <Button fullWidth variant="contained" color="secondary" onClick={() => handleResetForm(setFieldValue, resetForm)}>
                      Reset Form
                    </Button>
                    <Button variant="dashed" color="secondary" size="large" sx={{ height: '100%' }} onClick={() => setOpenDialog(true)}>
                      <MessageQuestion />
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <InputForm
                        label="Tanggal"
                        type="date"
                        name="tanggal"
                        errors={errors.tanggal}
                        touched={true}
                        value={values.tanggal}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel id="overtime-label">Status Longshift</InputLabel>
                        <Select
                          labelId="overtime-label"
                          name="overtime"
                          value={values.overtime}
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
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
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

                    <Grid item xs={12} sm={8} sx={{ mt: 2 }}>
                      <OptionKaryawan
                        label={'Driver'}
                        name={'driver_id'}
                        value={values.driver_id}
                        error={errors.driver_id}
                        touched={true}
                        startAdornment={<UserOctagon />}
                        helperText={true && errors.driver_id}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
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
                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                      <InputForm
                        label="HM Start"
                        type="text"
                        name="kmstart"
                        errors={errors}
                        touched={touched}
                        value={values.kmstart}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ mt: 2 }}>
                      <InputForm
                        label="HM Finish"
                        type="text"
                        name="kmfinish"
                        errors={errors}
                        touched={touched}
                        value={values.kmfinish}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                      <InputForm
                        label="Total Used"
                        type="text"
                        name={'hmtotal'}
                        errors={errors}
                        touched={touched}
                        value={values.hmtotal}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ mt: 2 }}>
                      <InputForm
                        label="Refuel BBM"
                        type="number"
                        name={'bbm'}
                        errors={errors}
                        touched={touched}
                        value={values.bbm}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <FieldArray name="kegiatan">
                  {({ remove }) => (
                    <>
                      {values.kegiatan?.map((item, idx) => {
                        return (
                          <Grid key={idx} container spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
                            <Grid item xs={12} sm={5}>
                              <OptionKegiatanKerja
                                value={item.kegiatan_id}
                                label={'Jenis Kegiatan'}
                                name={`kegiatan[${idx}].nmkegiatan`}
                                error={touched.kegiatan?.[idx]?.kegiatan_id && Boolean(errors.kegiatan?.[idx]?.kegiatan_id)}
                                startAdornment={<Arrow />}
                                setFieldValue={setFieldValue}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <OptionMaterialMining
                                value={item.material_id}
                                label={'Jenis Material'}
                                name={`kegiatan[${idx}].material`}
                                error={touched.kegiatan?.[idx]?.material_id && Boolean(errors.kegiatan?.[idx]?.material_id)}
                                startAdornment={<Ankr />}
                                setFieldValue={setFieldValue}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <OptionLokasiKerja
                                value={item.lokasi_id}
                                label="Nama Lokasi"
                                name={`kegiatan[${idx}].lokasi_id`}
                                error={touched.kegiatan?.[idx]?.lokasi_id && Boolean(errors.kegiatan?.[idx]?.lokasi_id)}
                                startAdornment={<AlignVertically />}
                                setFieldValue={setFieldValue}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <OptionLokasiKerja
                                value={item.lokasi_to}
                                label="Lokasi Tujuan"
                                name={`kegiatan[${idx}].lokasi_to`}
                                error={touched.kegiatan?.[idx]?.lokasi_to && Boolean(errors.kegiatan?.[idx]?.lokasi_to)}
                                startAdornment={<AlignVertically />}
                                setFieldValue={setFieldValue}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                              <InputForm
                                name={`kegiatan[${idx}].start`}
                                label="Start"
                                type="time"
                                value={item.start}
                                onChange={handleChange}
                                touched
                                errors={touched.kegiatan?.[idx]?.start && errors.kegiatan?.[idx]?.start}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                              <InputForm
                                label="Finish"
                                type="time"
                                name={`kegiatan[${idx}].finish`}
                                error={touched.kegiatan?.[idx]?.finish && Boolean(errors.kegiatan?.[idx]?.finish)}
                                value={item.finish}
                                onChange={handleChange}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                              <InputForm
                                label="SEQ"
                                type="text"
                                name={`kegiatan[${idx}].seq`}
                                error={touched.kegiatan?.[idx]?.seq && Boolean(errors.kegiatan?.[idx]?.seq)}
                                value={item.seq}
                                onChange={handleChange}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2} sx={{ mt: 2 }}>
                              <InputForm
                                label="Ritase"
                                type="text"
                                name={`kegiatan[${idx}].ritase`}
                                error={touched.kegiatan?.[idx]?.ritase && Boolean(errors.kegiatan?.[idx]?.ritase)}
                                value={item.ritase}
                                onChange={handleChange}
                              />
                            </Grid>
                            <Grid item xs={12} sm={1} sx={{ mt: 2 }}>
                              <IconButton variant="outlined" color="error" size="large" onClick={() => remove(idx)}>
                                <Trash />
                              </IconButton>
                            </Grid>
                          </Grid>
                        );
                      })}
                    </>
                  )}
                </FieldArray>
                <Grid
                  item
                  xs={12}
                  sm={12}
                  sx={{
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}
                >
                  <Button type="submit" variant="shadow" size="large" startIcon={<Send2 />}>
                    Kirim Timesheet
                  </Button>
                </Grid>
              </Grid>
            </Form>
          );
        }}
      </Formik>
    </MainCard>
  );
};

export default ScanDTTimesheetScreen;

const HelperComponent = ({ values, setFieldValue }) => {
  useEffect(() => {
    setFieldValue(values);
  }, [values, setFieldValue]);
  return null;
};
