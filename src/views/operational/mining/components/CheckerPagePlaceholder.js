'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Stack,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Typography,
  Divider,
  Button,
  InputLabel,
  FormControl,
  Select,
  FormHelperText,
  InputAdornment,
  OutlinedInput,
  LinearProgress,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import BtnBack from 'components/BtnBack';
import OptionDoms from 'components/OptionDoms';
import OptionCabang from 'components/OptionCabang';
import OptionShiftKerja from 'components/OptionShiftKerja';
import OptionMaterialMining from 'components/OptionMaterialMining';
import OptionLokasiPit from 'components/OptionLokasiPit';
import OptionEquipment from 'components/OptionEquipment';
import axiosServices from 'utils/axios';
import { openNotification } from 'api/notification';

const initialValues = {
  date_ops: moment().format('YYYY-MM-DD'),
  status: 'PRODUKSI',                                     // enum ('PRODUKSI', 'NON_PRODUKSI')
  cabang_id: '',                                          // OptionCabang
  shift_id: '',                                           // OptionShiftKerja
  material_id: '',                                        // OptionMaterialMining
  endstockpile_id: '',                                    // OptionLokasiPit
  excavator_id: '',                                       // OptionEquipment
  items: [
    {
      dom_id: '',                                         // OptionDoms
      dumptruck_id: '',                                   // OptionEquipment
      startpit_id: '',                                    // OptionLokasiPit
      starttime: moment().format('YYYY-MM-DD[T]00:00'),
      endtime: moment().format('YYYY-MM-DD[T]23:00'),
      duration: 10,
      seq: '',
      rit: 0,
    }
  ]
};

const validationSchema = Yup.object({
  date_ops: Yup.string().required('Tanggal wajib diisi'),
  status: Yup.string().oneOf(['PRODUKSI', 'NON_PRODUKSI']).required('Status wajib diisi'),
  cabang_id: Yup.string().required('Cabang wajib diisi'),
  shift_id: Yup.string().required('Shift wajib diisi'),
  material_id: Yup.string().required('Material wajib diisi'),
  endstockpile_id: Yup.string().when('status', {
    is: 'PRODUKSI',
    then: (schema) => schema.required('End Stockpile wajib diisi'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  excavator_id: Yup.string().required('Excavator wajib diisi'),
  items: Yup.array()
    .of(
      Yup.object({
        dom_id: Yup.string().required('Kode DOM wajib diisi'),
        dumptruck_id: Yup.string().required('Dumptruck wajib diisi'),
        startpit_id: Yup.string().required('Start Pit wajib diisi'),
        starttime: Yup.string().required('Jam mulai wajib diisi'),
        endtime: Yup.string()
          .required('Jam selesai wajib diisi')
          .test('end-after-start', 'Jam selesai harus lebih besar dari jam mulai', function (value) {
            const startValue = this.parent?.starttime;
            if (!startValue || !value) return true;
            const start = moment(startValue);
            const end = moment(value);
            if (!start.isValid() || !end.isValid()) return true;
            return end.isAfter(start);
          })
          .test('max-plus-one-day', 'Jam selesai maksimal H+1 dari tanggal operasi', function (value) {
            const dateOps = this.from?.[1]?.value?.date_ops;
            if (!dateOps || !value) return true;
            const end = moment(value);
            const max = moment(dateOps).add(1, 'day').endOf('day');
            if (!end.isValid() || !max.isValid()) return true;
            return end.isSameOrBefore(max);
          }),
        duration: Yup.number().min(0, 'Durasi minimal 0').required('Durasi wajib diisi'),
        seq: Yup.string().required('Seq wajib diisi'),
        rit: Yup.number().min(0, 'Rit minimal 0').required('Rit wajib diisi')
      }).test('start-min-date-ops', 'Jam mulai minimal sesuai tanggal operasi', function (itemValue) {
        const dateOps = this.from?.[1]?.value?.date_ops;
        const starttime = itemValue?.starttime;
        if (!dateOps || !starttime) return true;
        const start = moment(starttime);
        const min = moment(dateOps).startOf('day');
        if (!start.isValid() || !min.isValid()) return true;
        return start.isSameOrAfter(min);
      }).test('start-max-plus-one-day', 'Jam mulai maksimal H+1 dari tanggal operasi', function (itemValue) {
        const dateOps = this.from?.[1]?.value?.date_ops;
        const starttime = itemValue?.starttime;
        if (!dateOps || !starttime) return true;
        const start = moment(starttime);
        const max = moment(dateOps).add(1, 'day').endOf('day');
        if (!start.isValid() || !max.isValid()) return true;
        return start.isSameOrBefore(max);
      })
    )
    .min(1, 'Minimal 1 item dumptruck')
});

const statusOptions = [
  { value: 'PRODUKSI', label: 'PRODUKSI' },
  { value: 'NON_PRODUKSI', label: 'NON PRODUKSI' }
];

export default function CheckerPagePlaceholder({ heading, routeTitle, backUrl }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: routeTitle, to: backUrl },
    { title: heading }
  ];

  const toApiDateTime = (value) => {
    if (!value) return null;
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : null;
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...values,
        items: values.items.map((item) => ({
          ...item,
          starttime: toApiDateTime(item.starttime),
          endtime: toApiDateTime(item.endtime),
          rit: Number(item.rit || 0)
        }))
      };
      console.log('payload---', payload);
      

      await axiosServices.post('/ritase/pit-web', payload);

      openNotification({
        title: 'Sukses',
        message: 'Data checker berhasil disimpan',
        open: true,
        alert: { color: 'success' }
      });

      router.push(backUrl || '/daily-checker-pit');
    } catch (error) {
      const message = error?.response?.data?.diagnostic?.message || error?.message || 'Gagal menyimpan data checker';
      openNotification({
        title: 'Error',
        message,
        open: true,
        alert: { color: 'error' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickFile = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadStats(null);
    setUploadFile(file);
  };

  const handleDropFile = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadStats(null);
    setUploadFile(file);
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      setUploadError('Silakan pilih file .xlsx terlebih dahulu');
      return;
    }

    const ext = uploadFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx') {
      setUploadError('Format file harus .xlsx');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadStats(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('dry_run', dryRun ? 'true' : 'false');

      const response = await axiosServices.post('/ritase/pit/web-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000
      });

      const stats = response?.data?.rows || null;
      setUploadStats(stats);

      openNotification({
        open: true,
        title: 'success',
        message: response?.data?.diagnostic?.message || 'Upload file berhasil diproses',
        alert: { color: 'success' }
      });
    } catch (error) {
      const message =
        error?.code === 'ECONNABORTED'
          ? 'Upload melebihi batas waktu. Silakan coba lagi atau gunakan mode dry run untuk validasi awal.'
          : error?.response?.data?.diagnostic?.message || error?.response?.data?.message || error?.message || 'Upload gagal diproses';
      setUploadError(message);
      openNotification({
        open: true,
        title: 'error',
        message,
        alert: { color: 'error' }
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetUploadState = () => {
    setUploadFile(null);
    setUploadError('');
    setUploadStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const adorn = (content) => <InputAdornment position="start">{content}</InputAdornment>;
  const withOperationalDate = (dateOps, currentValue, fallbackTime = '00:00') => {
    if (!dateOps) return currentValue || '';
    if (!currentValue) return `${dateOps}T${fallbackTime}`;
    const parsed = moment(currentValue);
    const timePart = parsed.isValid() ? parsed.format('HH:mm') : fallbackTime;
    return `${dateOps}T${timePart}`;
  };

  const calculateDurationPerRit = (starttime, endtime, rit) => {
    const start = moment(starttime);
    const end = moment(endtime);
    const ritNum = Number(rit || 0);

    if (!start.isValid() || !end.isValid() || ritNum <= 0) return 0;
    const diffMinutes = end.diff(start, 'minutes', true);
    if (diffMinutes <= 0) return 0;
    return Math.max(0, Math.round(diffMinutes / ritNum));
  };

  return (
    <>
      <Breadcrumbs custom heading={heading} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/daily-checker-pit'} />}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Mode Input</Typography>
            <FormControlLabel
              control={<Switch checked={uploadMode} onChange={(e) => setUploadMode(e.target.checked)} />}
              label={uploadMode ? 'Upload File' : 'Input Manual'}
            />
          </Stack>

          {uploadMode && (
          <Paper variant="outlined" sx={{ p: 2.5, borderStyle: 'dashed', borderColor: isDragOver ? 'primary.main' : 'divider' }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                <Box>
                  <Typography variant="h6">Upload Excel Checker PIT</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload file ritase format .xlsx untuk insert massal ke backend dan auto matching.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label="Mode Upload Aktif" color="info" variant="outlined" />
                  <Chip label={dryRun ? 'Mode Dry Run' : 'Mode Commit'} color={dryRun ? 'warning' : 'success'} variant="outlined" />
                </Stack>
              </Stack>

              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropFile}
                sx={{
                  border: '1px dashed',
                  borderColor: isDragOver ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 2,
                  bgcolor: isDragOver ? 'primary.lighter' : 'background.paper'
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Button variant="outlined" onClick={handlePickFile} disabled={isUploading || !uploadMode}>
                    Pilih File
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {uploadFile ? uploadFile.name : 'Drag & drop file .xlsx ke area ini atau klik Pilih File'}
                  </Typography>
                </Stack>
                <input ref={fileInputRef} type="file" accept=".xlsx" hidden onChange={handleFileChange} />
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Button variant={dryRun ? 'contained' : 'outlined'} color="warning" onClick={() => setDryRun((prev) => !prev)} disabled={isUploading}>
                  {dryRun ? 'Dry Run Aktif' : 'Aktifkan Dry Run'}
                </Button>
                <Button variant="contained" onClick={handleUploadExcel} disabled={isUploading || !uploadFile || !uploadMode}>
                  {isUploading ? 'Memproses Upload...' : 'Upload ke Backend'}
                </Button>
                <Button variant="text" color="secondary" onClick={handleResetUploadState} disabled={isUploading}>
                  Reset Upload
                </Button>
              </Stack>

              {isUploading && <LinearProgress />}
              {uploadError && <Alert severity="error">{uploadError}</Alert>}

              {uploadStats && (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Total Row</Typography>
                      <Typography variant="subtitle2">{uploadStats.total_rows || 0}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Diproses</Typography>
                      <Typography variant="subtitle2">{uploadStats.processed_rows || 0}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Skip</Typography>
                      <Typography variant="subtitle2">{uploadStats.skipped_rows || 0}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Matched</Typography>
                      <Typography variant="subtitle2">{uploadStats.matched_count || 0}</Typography>
                    </Grid>
                  </Grid>

                  {Array.isArray(uploadStats.failed_samples) && uploadStats.failed_samples.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Contoh Data Gagal Diproses</Typography>
                      <Box sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Sheet</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Row</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Reason</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Data Row</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadStats.failed_samples.slice(0, 30).map((item, index) => (
                              <tr key={`failed-${index}`}>
                                <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{item.sheet || '-'}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{item.row || '-'}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{item.reason || '-'}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'pre-wrap', minWidth: 280 }}>
                                  {item.row_data ? JSON.stringify(item.row_data) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  )}
                </Paper>
              )}
            </Stack>
          </Paper>
          )}

          {!uploadMode && (
          <Formik initialValues={initialValues} enableReinitialize validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tanggal Operasi"
                      type="date"
                      name="date_ops"
                      value={values.date_ops}
                      onChange={(event) => {
                        const nextDateOps = event.target.value;
                        setFieldValue('date_ops', nextDateOps);
                        (values.items || []).forEach((it, index) => {
                          setFieldValue(`items.${index}.starttime`, withOperationalDate(nextDateOps, it.starttime, '00:00'));
                          setFieldValue(`items.${index}.endtime`, withOperationalDate(nextDateOps, it.endtime, '00:00'));
                        });
                      }}
                      onBlur={handleBlur}
                      error={Boolean(touched.date_ops && errors.date_ops)}
                      helperText={touched.date_ops && errors.date_ops}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ startAdornment: adorn('📅') }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth error={Boolean(touched.status && errors.status)}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        name="status"
                        value={values.status}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        input={<OutlinedInput label="Status" startAdornment={adorn('🏷️')} />}
                      >
                        {statusOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{touched.status && errors.status}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <OptionCabang
                      name="cabang_id"
                      label="Cabang"
                      value={values.cabang_id}
                      error={errors.cabang_id}
                      touched={touched.cabang_id}
                      startAdornment={'🏢'}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <OptionShiftKerja
                      name="shift_id"
                      label="Shift"
                      value={values.shift_id}
                      error={errors.shift_id}
                      touched={touched.shift_id}
                      startAdornment={'🕒'}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <OptionMaterialMining
                      name="material_id"
                      label="Material"
                      value={values.material_id}
                      error={errors.material_id}
                      touched={touched.material_id}
                      startAdornment={'⛏️'}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <OptionLokasiPit
                      name="endstockpile_id"
                      label="End Stockpile"
                      value={values.endstockpile_id}
                      error={errors.endstockpile_id}
                      touched={touched.endstockpile_id}
                      startAdornment={'📍'}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <OptionEquipment
                      name="excavator_id"
                      objValue="excavator"
                      label="Excavator"
                      value={values.excavator_id}
                      error={errors.excavator_id}
                      touched={touched.excavator_id}
                      startAdornment={'🚜'}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1.5 }}>
                      <Typography variant="subtitle2">Detail Dumptruck</Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12}>
                    <FieldArray name="items">
                      {({ push, remove }) => (
                        <Stack spacing={2}>
                          {values.items.map((item, index) => {
                            const itemErr = errors.items?.[index] || {};
                            const itemTouched = touched.items?.[index] || {};

                            return (
                              <Paper key={`item-${index}`} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Grid container spacing={2} alignItems="center" sx={{mb: 2}}>
                                  <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                      fullWidth
                                      label="Start Time"
                                      type="datetime-local"
                                      name={`items.${index}.starttime`}
                                      value={item.starttime}
                                      onChange={(event) => {
                                        const nextStart = event.target.value;
                                        setFieldValue(`items.${index}.starttime`, nextStart);
                                        const nextDuration = calculateDurationPerRit(nextStart, item.endtime, item.rit);
                                        setFieldValue(`items.${index}.duration`, nextDuration);
                                      }}
                                      onBlur={handleBlur}
                                      error={Boolean(itemTouched.starttime && itemErr.starttime)}
                                      helperText={itemTouched.starttime && itemErr.starttime}
                                      InputLabelProps={{ shrink: true }}
                                      inputProps={{
                                        min: values.date_ops ? `${values.date_ops}T00:00` : undefined,
                                        max: values.date_ops ? `${moment(values.date_ops).add(1, 'day').format('YYYY-MM-DD')}T23:59` : undefined
                                      }}
                                      InputProps={{ startAdornment: adorn('🕓') }}
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                      fullWidth
                                      label="End Time"
                                      type="datetime-local"
                                      name={`items.${index}.endtime`}
                                      value={item.endtime}
                                      onChange={(event) => {
                                        const nextEnd = event.target.value;
                                        setFieldValue(`items.${index}.endtime`, nextEnd);
                                        const nextDuration = calculateDurationPerRit(item.starttime, nextEnd, item.rit);
                                        setFieldValue(`items.${index}.duration`, nextDuration);
                                      }}
                                      onBlur={handleBlur}
                                      error={Boolean(itemTouched.endtime && itemErr.endtime)}
                                      helperText={itemTouched.endtime && itemErr.endtime}
                                      InputLabelProps={{ shrink: true }}
                                      inputProps={{
                                        min: values.date_ops ? `${values.date_ops}T00:00` : undefined,
                                        max: values.date_ops ? `${moment(values.date_ops).add(1, 'day').format('YYYY-MM-DD')}T23:59` : undefined
                                      }}
                                      InputProps={{ startAdornment: adorn('🕔') }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={2.5}>
                                    <TextField
                                      fullWidth
                                      label="Durasi antar ritase (menit)"
                                      type="number"
                                      name={`items.${index}.duration`}
                                      value={item.duration}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={Boolean(itemTouched.duration && itemErr.duration)}
                                      helperText={itemTouched.duration && itemErr.duration}
                                      InputProps={{ startAdornment: adorn('🕔'), readOnly: true }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={3.5}>
                                    <OptionDoms
                                      name={`items.${index}.dom_id`}
                                      objValue={`items.${index}.dom`}
                                      label="Kode Doms"
                                      value={item.dom_id}
                                      error={itemErr.dom_id}
                                      touched={itemTouched.dom_id}
                                      startAdornment={'⛰️'}
                                      setFieldValue={setFieldValue}
                                    />
                                  </Grid>
                                </Grid>
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={12} sm={6} md={4}>
                                    <OptionEquipment
                                      name={`items.${index}.dumptruck_id`}
                                      objValue={`items.${index}.dumptruck`}
                                      label="Dumptruck"
                                      value={item.dumptruck_id}
                                      error={itemErr.dumptruck_id}
                                      touched={itemTouched.dumptruck_id}
                                      startAdornment={'🚛'}
                                      setFieldValue={setFieldValue}
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6} md={4}>
                                    <OptionLokasiPit
                                      name={`items.${index}.startpit_id`}
                                      label="Start Pit"
                                      value={item.startpit_id}
                                      error={itemErr.startpit_id}
                                      touched={itemTouched.startpit_id}
                                      startAdornment={'📌'}
                                      setFieldValue={setFieldValue}
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6} md={1.5}>
                                    <TextField
                                      fullWidth
                                      label="Seq"
                                      name={`items.${index}.seq`}
                                      value={item.seq}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={Boolean(itemTouched.seq && itemErr.seq)}
                                      helperText={itemTouched.seq && itemErr.seq}
                                      InputProps={{ startAdornment: adorn('#') }}
                                    />
                                  </Grid>

                                  <Grid item xs={12} sm={6} md={1.5}>
                                    <TextField
                                      fullWidth
                                      label="Rit"
                                      type="number"
                                      name={`items.${index}.rit`}
                                      value={item.rit}
                                      onChange={(event) => {
                                        const nextRit = event.target.value;
                                        setFieldValue(`items.${index}.rit`, nextRit);
                                        const nextDuration = calculateDurationPerRit(item.starttime, item.endtime, nextRit);
                                        setFieldValue(`items.${index}.duration`, nextDuration);
                                      }}
                                      onBlur={handleBlur}
                                      error={Boolean(itemTouched.rit && itemErr.rit)}
                                      helperText={itemTouched.rit && itemErr.rit}
                                      InputProps={{ startAdornment: adorn('R') }}
                                    />
                                  </Grid>

                                  <Grid item xs={12} md={1}>
                                    <Button
                                      fullWidth
                                      color="error"
                                      variant="outlined"
                                      disabled={values.items.length === 1}
                                      onClick={() => remove(index)}
                                    >
                                      Hapus
                                    </Button>
                                  </Grid>
                                </Grid>
                              </Paper>
                            );
                          })}

                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Button
                              variant="outlined"
                              onClick={() =>
                                push({
                                  dumptruck_id: '',
                                  startpit_id: '',
                                  starttime: values.date_ops ? `${values.date_ops}T00:00` : '',
                                  endtime: values.date_ops ? `${values.date_ops}T00:00` : '',
                                  seq: '',
                                  rit: 0,
                                  duration: 10,
                                  dom_id: ''
                                })
                              }
                            >
                              + Tambah Item
                            </Button>

                            <Button type="submit" variant="contained" disabled={isSubmitting}>
                              Simpan
                            </Button>
                          </Stack>
                        </Stack>
                      )}
                    </FieldArray>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
          )}
        </Stack>
      </MainCard>
    </>
  );
}
