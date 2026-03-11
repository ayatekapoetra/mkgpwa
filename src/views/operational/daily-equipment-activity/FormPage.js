"use client";

import { useMemo } from 'react';
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

const itemSchema = Yup.object().shape({
  equipment_id: Yup.string().required('Equipment wajib dipilih'),
  karyawan_id: Yup.string()
    .nullable()
    .when('$status', (status, schema) =>
      statusOptionalKaryawan.includes(status) ? schema.nullable() : schema.required('Karyawan/Operator wajib diisi')
    ),
  kegiatan_id: Yup.string().nullable(),
  lokasi_id: Yup.string().required('Lokasi wajib dipilih'),
  lokasi_to: Yup.mixed()
    .transform((val, orig) => (orig === '' ? null : val))
    .nullable()
    .when(['$ctg', '$status'], (ctg, status, schema) => {
      const needLokasiTo = ctg !== 'HE' && status === 'BEROPERASI';
      return needLokasiTo ? schema.required('Lokasi tujuan wajib diisi untuk DT beroperasi') : schema.nullable();
    }),
  keterangan: Yup.string().nullable(),
  aktif: Yup.string().oneOf(['Y', 'N']).required('Aktif wajib diisi'),
  equipment: Yup.mixed().nullable()
});

const schemaEntries = Yup.object().shape({
  date_ops: Yup.string().required('Tanggal wajib diisi'),
  shift: Yup.string().oneOf(['PAGI', 'MALAM']).required('Shift wajib diisi'),
  status: Yup.string().oneOf(statusOptions.map((s) => s.key)).required('Status wajib diisi'),
  ctg: Yup.string().required('Kategori equipment wajib'),
  cabang_id: Yup.string().required('Cabang wajib dipilih'),
  items: Yup.array().of(itemSchema).min(1, 'Minimal 1 baris')
});

const defaultItem = {
  id: null,
  equipment_id: '',
  equipment: null,
  karyawan_id: '',
  kegiatan_id: '',
  lokasi_id: '',
  lokasi_to: '',
  keterangan: '',
  aktif: 'Y'
};

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
        date_ops: initialData.date_ops || '',
        shift: initialData.shift || 'PAGI',
        status: initialData.status || 'BEROPERASI',
        ctg: initialData.ctg || initialData?.equipment?.kategori || initialData?.equipment?.ctg || '',
        cabang_id: initialData.cabang_id || initialData?.equipment?.cabang_id || '',
        items: [
          {
            ...defaultItem,
            id: initialData.id,
            equipment_id: initialData.equipment_id || '',
            equipment: initialData.equipment || null,
            karyawan_id: initialData.karyawan_id || '',
            kegiatan_id: initialData.kegiatan_id || '',
            lokasi_id: initialData.lokasi_id || '',
            lokasi_to: initialData.lokasi_to || '',
            keterangan: initialData.keterangan || '',
            aktif: initialData.aktif || 'Y'
          }
        ]
      };
    }
    return {
      date_ops: '',
      shift: 'PAGI',
      status: 'BEROPERASI',
      ctg: '',
      cabang_id: '',
      items: [defaultItem]
    };
  }, [initialData]);

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Daily Equipment Activity', to: '/daily-equipment-activity' },
    { title: isEdit ? 'Edit' : 'Create', to: '#' }
  ];

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const common = {
        date_ops: values.date_ops,
        shift: values.shift,
        status: values.status,
        ctg: values.ctg,
        cabang_id: values.cabang_id
      };

      if (isEdit) {
        const [item] = values.items;
        const url = `/api/operation/activity-plan/${item.id}/update`;
        await axiosServices.post(url, { ...common, ...item });
      } else {
        for (const item of values.items) {
          await axiosServices.post('/api/operation/activity-plan/create', { ...common, ...item });
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

      <Formik enableReinitialize initialValues={initialValues} validationSchema={schemaEntries} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting, validateForm }) => (
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
                <Grid item xs={12} sm={3} mb={2}>
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
                <Grid item xs={12} sm={5}>
                  <OptionCabang
                    value={values.cabang_id}
                    name={'cabang_id'}
                    label="Cabang"
                    error={errors.cabang_id}
                    touched={touched.cabang_id}
                    setFieldValue={setFieldValue}
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
                      values.items?.forEach((_, idx) => {
                        setFieldValue(`items[${idx}].equipment_id`, '');
                        setFieldValue(`items[${idx}].equipment`, null);
                        if (val === 'HE') {
                          setFieldValue(`items[${idx}].lokasi_to`, '');
                        }
                      });
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
                <Grid item xs={12} sm={2}>
                  <SelectForm
                    array={statusOptions}
                    label="Status"
                    name="status"
                    value={values.status}
                    onChange={(e) => {
                      handleChange(e);
                      const newStatus = e.target.value;
                      values.items?.forEach((_, idx) => {
                        const needLokasiTo = values.ctg !== 'HE' && newStatus === 'BEROPERASI';
                        if (!needLokasiTo) {
                          setFieldValue(`items[${idx}].lokasi_to`, '');
                        }
                      });
                    }}
                    onBlur={() => validateForm()}
                    touched={touched}
                    errors={errors}
                  />
                </Grid>
              </Grid>

              <FieldArray
                name="items"
                render={({ push, remove }) => (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {values.items?.map((item, idx) => {
                      const itemErrors = errors.items?.[idx] || {};
                      const itemTouched = touched.items?.[idx] || {};

                      return (
                        <MainCard
                          key={idx}
                          title={`Data #${idx + 1}`}
                          secondary={
                            !isEdit && (
                              <Button
                                color="error"
                                variant="outlined"
                                size="small"
                                onClick={() => remove(idx)}
                                disabled={(values.items?.length || 1) === 1}
                              >
                                Hapus
                              </Button>
                            )
                          }
                          content
                        >
                          <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={4}>
                              <OptionEquipment
                                value={item.equipment_id}
                                label="Equipment"
                                name={`items[${idx}].equipment_id`}
                                objValue={`items[${idx}].equipment`}
                                error={itemErrors?.equipment_id}
                                touched={itemTouched?.equipment_id}
                                setFieldValue={setFieldValue}
                                startAdornment={<Map />}
                                filterParams={{ ctg: values.ctg || undefined }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <OptionKaryawan
                                value={item.karyawan_id}
                                name={`items[${idx}].karyawan_id`}
                                label="Operator / Driver"
                                error={itemErrors?.karyawan_id}
                                touched={itemTouched?.karyawan_id}
                                setFieldValue={setFieldValue}
                                startAdornment={<Driver />}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <OptionKegiatanKerja
                                value={item.kegiatan_id}
                                name={`items[${idx}].kegiatan_id`}
                                label="Kegiatan"
                                error={itemErrors?.kegiatan_id}
                                touched={itemTouched?.kegiatan_id}
                                setFieldValue={setFieldValue}
                                searchParams={{ type: values.ctg === 'HE' ? 'HE' : 'DT' }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <OptionLokasiKerja
                                value={item.lokasi_id}
                                name={`items[${idx}].lokasi_id`}
                                label="Lokasi"
                                error={itemErrors?.lokasi_id}
                                touched={itemTouched?.lokasi_id}
                                setFieldValue={setFieldValue}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <OptionLokasiKerja
                                value={item.lokasi_to}
                                name={`items[${idx}].lokasi_to`}
                                label="Lokasi Tujuan"
                                error={itemErrors?.lokasi_to}
                                touched={itemTouched?.lokasi_to}
                                setFieldValue={setFieldValue}
                                disabled={values.ctg === 'HE' || values.status !== 'BEROPERASI'}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <SelectForm
                                array={[
                                  { key: 'Y', teks: 'Aktif' },
                                  { key: 'N', teks: 'Tidak Aktif' }
                                ]}
                                label="Aktif"
                                name={`items[${idx}].aktif`}
                                value={item.aktif}
                                onChange={handleChange}
                                onBlur={() => validateForm()}
                                touched={itemTouched}
                                errors={itemErrors}
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <InputAreaForm
                                label="Keterangan"
                                name={`items[${idx}].keterangan`}
                                value={item.keterangan}
                                onChange={handleChange}
                                errors={itemErrors}
                                touched={itemTouched}
                                rows={3}
                              />
                            </Grid>
                          </Grid>
                        </MainCard>
                      );
                    })}

                    {!isEdit && (
                      <Stack direction="row" justifyContent="flex-start">
                        <Button variant="outlined" startIcon={<Add />} onClick={() => push({ ...defaultItem })}>
                          Tambah Baris
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                )}
              />
            </Form>
          </MainCard>
        )}
      </Formik>
    </Stack>
  );
}
