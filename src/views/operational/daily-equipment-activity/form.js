"use client";

import { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Add, Edit, Calendar, Map, Driver } from 'iconsax-react';

import InputForm from 'components/InputForm';
import SelectForm from 'components/SelectForm';
import InputAreaForm from 'components/InputAreaForm';
import OptionEquipment from 'components/OptionEquipment';
import OptionKaryawan from 'components/OptionKaryawan';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionCabang from 'components/OptionCabang';
import axiosServices from 'utils/axios';
import { openNotification } from 'api/notification';

const statusOptions = [
  { key: 'BEROPERASI', teks: 'BEROPERASI' },
  { key: 'STANDBY', teks: 'STANDBY' },
  { key: 'NO JOB', teks: 'NO JOB' },
  { key: 'NO OPERATOR', teks: 'NO OPERATOR' },
  { key: 'NO DRIVER', teks: 'NO DRIVER' },
  { key: 'BREAKDOWN', teks: 'BREAKDOWN' }
];

const shiftOptions = [
  { key: 'PAGI', teks: 'PAGI' },
  { key: 'MALAM', teks: 'MALAM' }
];

const statusOptionalKaryawan = ['NO OPERATOR', 'NO DRIVER', 'BREAKDOWN', 'STANDBY'];

const buildValidationSchema = (ctg, status) =>
  Yup.object().shape({
    date_ops: Yup.string().required('Tanggal wajib diisi'),
    shift: Yup.string().oneOf(['PAGI', 'MALAM']).required('Shift wajib diisi'),
    status: Yup.string().oneOf(statusOptions.map((s) => s.key)).required('Status wajib diisi'),
    equipment_id: Yup.string().required('Equipment wajib dipilih'),
    ctg: Yup.string().required('Kategori equipment wajib'),
    cabang_id: Yup.string().required('Cabang wajib dipilih'),
    lokasi_id: Yup.string().required('Lokasi wajib dipilih'),
    lokasi_to: Yup.string()
      .nullable()
      .test('lokasi-to-rule', 'Lokasi tujuan wajib diisi untuk DT beroperasi', function (value) {
        const needLokasiTo = ctg !== 'HE' && status === 'BEROPERASI';
        if (!needLokasiTo) return true;
        return !!value;
      }),
    karyawan_id: Yup.string()
      .nullable()
      .test('karyawan-rule', 'Karyawan/Operator wajib diisi', function (value) {
        if (statusOptionalKaryawan.includes(status)) return true;
        return !!value;
      }),
    kegiatan_id: Yup.string().nullable(),
    keterangan: Yup.string().nullable(),
    aktif: Yup.string().oneOf(['Y', 'N']).required('Aktif wajib diisi')
  });

const defaultValues = {
  id: null,
  date_ops: '',
  shift: 'PAGI',
  status: 'BEROPERASI',
  equipment_id: '',
  equipment: null,
  ctg: '',
  cabang_id: '',
  karyawan_id: '',
  kegiatan_id: '',
  lokasi_id: '',
  lokasi_to: '',
  keterangan: '',
  aktif: 'Y'
};

export default function ActivityForm({ open, onClose, onSuccess, initialData }) {
  const initialValues = useMemo(() => ({
    ...defaultValues,
    ...initialData,
    equipment_id: initialData?.equipment_id || '',
    ctg: initialData?.ctg || initialData?.equipment?.kategori || initialData?.equipment?.ctg || '',
    cabang_id: initialData?.cabang_id || '',
    karyawan_id: initialData?.karyawan_id || '',
    lokasi_id: initialData?.lokasi_id || '',
    lokasi_to: initialData?.lokasi_to || '',
    kegiatan_id: initialData?.kegiatan_id || '',
    shift: initialData?.shift || 'PAGI',
    status: initialData?.status || 'BEROPERASI',
    aktif: initialData?.aktif || 'Y'
  }), [initialData]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const url = values.id ? `/api/operation/activity-plan/${values.id}/update` : '/api/operation/activity-plan/create';
      await axiosServices.post(url, values);
      onSuccess?.();
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.diagnostic?.error || 'Gagal menyimpan data',
        alert: { color: 'error' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          {initialData ? <Edit size={20} /> : <Add size={20} />}
          <Typography variant="h5">{initialData ? 'Ubah Aktivitas' : 'Tambah Aktivitas'}</Typography>
        </Stack>
      </DialogTitle>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={(values) => buildValidationSchema(values.ctg, values.status)}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting, validateForm }) => {
          // Responsif rule: auto-null lokasi_to saat tidak wajib
          useEffect(() => {
            const needLokasiTo = values.ctg !== 'HE' && values.status === 'BEROPERASI';
            if (!needLokasiTo && values.lokasi_to) {
              setFieldValue('lokasi_to', '');
            }
          }, [values.ctg, values.status, values.lokasi_to, setFieldValue]);

          useEffect(() => {
            if (values.equipment) {
              const eq = values.equipment;
              const derivedCtg = eq.kategori || eq.ctg || '';
              if (derivedCtg && derivedCtg !== values.ctg) {
                setFieldValue('ctg', derivedCtg);
              }
              if (!values.cabang_id && eq.cabang_id) {
                setFieldValue('cabang_id', eq.cabang_id);
              }
            }
          }, [values.equipment, values.ctg, values.cabang_id, setFieldValue]);

          return (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <InputForm
                      label="Tanggal Operasional"
                      name="date_ops"
                      type="date"
                      value={values.date_ops}
                      onChange={handleChange}
                      errors={errors}
                      touched={touched}
                      startAdornment={<Calendar />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <SelectForm
                      array={shiftOptions}
                      label="Shift"
                      name="shift"
                      value={values.shift}
                      onChange={handleChange}
                      onBlur={() => validateForm()}
                      touched={touched}
                      errors={errors}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <SelectForm
                      array={statusOptions}
                      label="Status"
                      name="status"
                      value={values.status}
                      onChange={handleChange}
                      onBlur={() => validateForm()}
                      touched={touched}
                      errors={errors}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <OptionEquipment
                      value={values.equipment_id}
                      label="Equipment"
                      name="equipment_id"
                      objValue="equipment"
                      error={errors.equipment_id}
                      touched={touched.equipment_id}
                      setFieldValue={setFieldValue}
                      startAdornment={<Map />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputForm
                      label="Kategori (ctg)"
                      name="ctg"
                      value={values.ctg}
                      onChange={handleChange}
                      errors={errors}
                      touched={touched}
                      disabled
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <OptionKaryawan
                      value={values.karyawan_id}
                      name={'karyawan_id'}
                      label="Operator / Driver"
                      error={errors.karyawan_id}
                      touched={touched.karyawan_id}
                      setFieldValue={setFieldValue}
                      startAdornment={<Driver />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <OptionKegiatanKerja
                      value={values.kegiatan_id}
                      name={'kegiatan_id'}
                      label="Kegiatan"
                      error={errors.kegiatan_id}
                      touched={touched.kegiatan_id}
                      setFieldValue={setFieldValue}
                      searchParams={{ type: values.ctg === 'HE' ? 'HE' : 'DT' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <OptionLokasiKerja
                      value={values.lokasi_id}
                      name={'lokasi_id'}
                      label="Lokasi"
                      error={errors.lokasi_id}
                      touched={touched.lokasi_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <OptionLokasiKerja
                      value={values.lokasi_to}
                      name={'lokasi_to'}
                      label="Lokasi Tujuan"
                      error={errors.lokasi_to}
                      touched={touched.lokasi_to}
                      setFieldValue={setFieldValue}
                      disabled={values.ctg === 'HE' || values.status !== 'BEROPERASI'}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <OptionCabang
                      value={values.cabang_id}
                      name={'cabang_id'}
                      label="Cabang"
                      error={errors.cabang_id}
                      touched={touched.cabang_id}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <SelectForm
                      array={[
                        { key: 'Y', teks: 'Aktif' },
                        { key: 'N', teks: 'Tidak Aktif' }
                      ]}
                      label="Aktif"
                      name="aktif"
                      value={values.aktif}
                      onChange={handleChange}
                      onBlur={() => validateForm()}
                      touched={touched}
                      errors={errors}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <InputAreaForm
                      label="Keterangan"
                      name="keterangan"
                      value={values.keterangan}
                      onChange={handleChange}
                      errors={errors}
                      touched={touched}
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose} color="secondary" variant="outlined">
                  Batal
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {initialData ? 'Simpan Perubahan' : 'Simpan'}
                </Button>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
}
