"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';

import { Grid, Stack, Button } from '@mui/material';
import { Add, Edit, Calendar, Driver, Map } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import InputForm from 'components/InputForm';
import InputAreaForm from 'components/InputAreaForm';
import SelectForm from 'components/SelectForm';
import OptionEquipment from 'components/OptionEquipment';
import OptionKaryawan from 'components/OptionKaryawan';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionCabang from 'components/OptionCabang';
import { APP_DEFAULT_PATH } from 'config';
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

const ctgOptions = [
  { key: 'HE', teks: 'HE (Alat Berat)' },
  { key: 'DT', teks: 'DT (Dumptruck)' }
];

const statusOptionalKaryawan = ['NO OPERATOR', 'NO DRIVER', 'BREAKDOWN', 'STANDBY'];

const entrySchema = Yup.object().shape({
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
      const ctg = this.parent.ctg;
      const status = this.parent.status;
      const needLokasiTo = ctg !== 'HE' && status === 'BEROPERASI';
      if (!needLokasiTo) return true;
      return !!value;
    }),
  karyawan_id: Yup.string()
    .nullable()
    .test('karyawan-rule', 'Karyawan/Operator wajib diisi', function (value) {
      const status = this.parent.status;
      if (statusOptionalKaryawan.includes(status)) return true;
      return !!value;
    }),
  kegiatan_id: Yup.string().nullable(),
  keterangan: Yup.string().nullable(),
  aktif: Yup.string().oneOf(['Y', 'N']).required('Aktif wajib diisi')
});

const schemaEntries = Yup.object().shape({
  entries: Yup.array().of(entrySchema).min(1, 'Minimal 1 baris')
});

const defaultEntry = {
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

const schemaEntries = Yup.object().shape({
  entries: Yup.array()
    .of(
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
            const ctg = this.parent.ctg;
            const status = this.parent.status;
            const needLokasiTo = ctg !== 'HE' && status === 'BEROPERASI';
            if (!needLokasiTo) return true;
            return !!value;
          }),
        karyawan_id: Yup.string()
          .nullable()
          .test('karyawan-rule', 'Karyawan/Operator wajib diisi', function (value) {
            const status = this.parent.status;
            if (statusOptionalKaryawan.includes(status)) return true;
            return !!value;
          }),
        kegiatan_id: Yup.string().nullable(),
        keterangan: Yup.string().nullable(),
        aktif: Yup.string().oneOf(['Y', 'N']).required('Aktif wajib diisi')
      })
    )
    .min(1, 'Minimal 1 baris')
});

export default function ActivityFormPage({
  mode = 'create',
  initialData = {},
  heading = 'Aktivitas Harian',
  backHref = '/daily-equipment-activity'
}) {
  const isEdit = mode === 'edit';

  const initialValues = useMemo(() => {
    if (initialData && initialData.id) {
      return {
        entries: [
          {
            ...defaultEntry,
            ...initialData,
            id: initialData.id,
            equipment_id: initialData?.equipment_id || '',
            equipment: initialData?.equipment || null,
            ctg: initialData?.ctg || initialData?.equipment?.kategori || initialData?.equipment?.ctg || '',
            cabang_id: initialData?.cabang_id || initialData?.equipment?.cabang_id || '',
            karyawan_id: initialData?.karyawan_id || '',
            lokasi_id: initialData?.lokasi_id || '',
            lokasi_to: initialData?.lokasi_to || '',
            kegiatan_id: initialData?.kegiatan_id || '',
            shift: initialData?.shift || 'PAGI',
            status: initialData?.status || 'BEROPERASI',
            aktif: initialData?.aktif || 'Y'
          }
        ]
      };
    }
    return {
      entries: [defaultEntry]
    };
  }, [initialData]);

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Daily Equipment Activity', to: '/daily-equipment-activity' },
    { title: isEdit ? 'Edit' : 'Create', to: '#' }
  ];

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEdit) {
        const [entry] = values.entries;
        const url = `/api/operation/activity-plan/${entry.id}/update`;
        await axiosServices.post(url, entry);
      } else {
        for (const entry of values.entries) {
          await axiosServices.post('/api/operation/activity-plan/create', entry);
        }
      }
      openNotification({ open: true, title: 'success', message: 'Data tersimpan', alert: { color: 'success' } });
      window.location.href = backHref;
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
    <Stack spacing={2}>
      <Breadcrumbs heading={heading} links={breadcrumbLinks} />

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schemaEntries}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting, validateForm }) => {

          return (
            <MainCard
              title={heading}
              secondary={
                <Stack direction="row" spacing={1}>
                  <Button component={Link} href={backHref} variant="outlined" color="secondary">
                    Batal
                  </Button>
                  <Button type="submit" variant="contained" startIcon={isEdit ? <Edit /> : <Add />} disabled={isSubmitting}>
                    {isEdit ? 'Simpan Perubahan' : 'Simpan'}
                  </Button>
                </Stack>
              }
              content
            >
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
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
                  <Grid item xs={12} sm={2}>
                    <SelectForm
                      array={ctgOptions}
                      label="Kategori (ctg)"
                      name="ctg"
                      value={values.ctg}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldValue('ctg', val);
                        // reset equipment & lokasi_to when kategori berubah
                        setFieldValue('equipment_id', '');
                        setFieldValue('equipment', null);
                        if (val === 'HE') {
                          setFieldValue('lokasi_to', '');
                        }
                      }}
                      onBlur={() => validateForm()}
                      touched={touched}
                      errors={errors}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
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
                      filterParams={{ ctg: values.ctg || undefined }}
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
              </Form>
            </MainCard>
          );
        }}
      </Formik>
    </Stack>
  );
}
