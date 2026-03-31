"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';

import { Grid, Stack, Button } from '@mui/material';
import { Add, Edit, Calendar, TagUser, Truck, Alarm, Verify } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import InputForm from 'components/InputForm';
import InputAreaForm from 'components/InputAreaForm';
import SelectForm from 'components/SelectForm';
import OptionEquipment from 'components/OptionEquipment';
import OptionOperatorDriver from 'components/OptionOperatorDriver';
import OptionKegiatanKerja from 'components/OptionKegiatanKerja';
import OptionLokasiKerja from 'components/OptionLokasiPit';
import OptionCabang from 'components/OptionCabang';
import OptionMaterialMining from 'components/OptionMaterialMining';
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

// const statusOptionalKaryawan = ['NO OPERATOR', 'NO DRIVER', 'BREAKDOWN', 'STANDBY'];

const itemSchema = Yup.object().shape({
  equipment_id: Yup.string().required('Equipment wajib dipilih'),
  karyawan_id: Yup.string(),
  kegiatan_id: Yup.string(),
  material_id: Yup.string(),
  lokasi_id: Yup.string().required('Lokasi wajib dipilih'),
  lokasi_to: Yup.string(),
  keterangan: Yup.string(),
  equipment: Yup.mixed()
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
  material_id: '',
  lokasi_id: '',
  lokasi_to: '',
  keterangan: ''
};

export default function ActivityFormPage({
  mode = 'create',
  initialData = {},
  heading = 'Aktivitas Harian',
  breadcrumbHeading,
  breadcrumbLinks: breadcrumbLinksProp,
  backHref = '/daily-equipment-activity'
}) {
  const isEdit = mode === 'edit';
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const initialValues = useMemo(() => {
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      // Use moment.js to format date as YYYY-MM-DD
      return moment(dateStr).format('YYYY-MM-DD');
    };
    
    if (initialData && initialData.id) {
      return {
        date_ops: formatDate(initialData.date_ops || todayStr),
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
            material_id: initialData.material_id || '',
            lokasi_id: initialData.lokasi_id || '',
            lokasi_to: initialData.lokasi_to || '',
            keterangan: initialData.keterangan || ''
          }
        ]
      };
    }
    return {
      date_ops: todayStr,
      shift: 'PAGI',
      status: 'BEROPERASI',
      ctg: 'DT',
      cabang_id: '',
      items: [defaultItem]
    };
  }, [initialData, todayStr]);

  const breadcrumbLinks =
    breadcrumbLinksProp || [
      { title: 'Home', to: APP_DEFAULT_PATH },
      { title: 'Daily Equipment Activity', to: '/daily-equipment-activity' },
      { title: isEdit ? 'Edit' : 'Create', to: '#' }
    ];

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log('cncncnccn');
    
    try {
      // Clean up the payload - remove any undefined/null values that might cause issues
      const cleanPayload = (obj) => {
        const cleaned = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            cleaned[key] = obj[key];
          }
        });
        return cleaned;
      };

      const common = cleanPayload({
        date_ops: values.date_ops,
        shift: values.shift,
        status: values.status,
        ctg: values.ctg,
        cabang_id: values.cabang_id
      });

      if (isEdit) {
        const [item] = values.items;
        const payload = {
          ...common,
          ...cleanPayload({
            id: item.id,
            equipment_id: item.equipment_id,
            karyawan_id: item.karyawan_id,
            kegiatan_id: item.kegiatan_id,
            material_id: item.material_id,
            lokasi_id: item.lokasi_id,
            lokasi_to: item.lokasi_to,
            keterangan: item.keterangan
          })
        };
        console.log('EDIT PAYLOAD:', JSON.stringify(payload, null, 2));
        const url = `/api/operation/activity-plan/${item.id}/update`;
        await axiosServices.post(url, payload);
      } else {
        for (const item of values.items) {
          const payload = {
            ...common,
            ...cleanPayload({
              equipment_id: item.equipment_id,
              karyawan_id: item.karyawan_id,
              kegiatan_id: item.kegiatan_id,
              material_id: item.material_id,
              lokasi_id: item.lokasi_id,
              lokasi_to: item.lokasi_to,
              keterangan: item.keterangan
            })
          };
          console.log('CREATE PAYLOAD:', JSON.stringify(payload, null, 2));
          await axiosServices.post('/api/operation/activity-plan/create', payload);
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
      <Breadcrumbs custom heading={breadcrumbHeading ?? heading} links={breadcrumbLinks} />

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validateOnChange={false}
        validateOnBlur={false}
onSubmit={async (vals, helpers) => {
          console.log('FORM SUBMIT TRIGGERED');
          console.log('FORM VALUES:', vals);
          
          // Simple manual validation before submit
          const errors = {};
          if (!vals.date_ops) errors.date_ops = 'Tanggal wajib diisi';
          if (!vals.shift) errors.shift = 'Shift wajib diisi';
          if (!vals.status) errors.status = 'Status wajib diisi';
          if (!vals.ctg) errors.ctg = 'Kategori equipment wajib';
          if (!vals.cabang_id) errors.cabang_id = 'Cabang wajib dipilih';
          
          if (!vals.items || vals.items.length === 0) {
            errors.items = 'Minimal 1 baris';
          } else {
            vals.items.forEach((item, idx) => {
              if (!item.equipment_id) errors[`items[${idx}].equipment_id`] = 'Equipment wajib dipilih';
              if (!item.lokasi_id) errors[`items[${idx}].lokasi_id`] = 'Lokasi wajib dipilih';
              if (vals.status === 'BEROPERASI' && !item.material_id) {
                errors[`items[${idx}].material_id`] = 'Material wajib dipilih untuk status BEROPERASI';
              }
            });
          }
          
          if (Object.keys(errors).length > 0) {
            console.log('VALIDATION ERRORS:', errors);
            helpers.setErrors(errors);
            helpers.setSubmitting(false);
            openNotification({ open: true, title: 'error', message: 'Lengkapi field wajib', alert: { color: 'error' } });
            return;
          }
          
          console.log('VALIDATION PASSED, CALLING handleSubmit');
          return handleSubmit(vals, helpers);
        }}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting, validateForm }) => {
          // console.log('VALUES----', values);
          // console.log('ERRORS----', errors);
          // console.log('SUBMITTING----', isSubmitting);
          
          return (
            <MainCard
            title={heading}
            content
          >
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={2} mb={2}>
                  <InputForm
                    label="Tanggal Operasional"
                    name="date_ops"
                    type="date"
                    value={values.date_ops ? values.date_ops.split('T')[0] : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange({
                        target: {
                          name: 'date_ops',
                          value: value
                        }
                      });
                    }}
                    errors={errors}
                    touched={touched}
                    startAdornment={<Calendar />}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
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
                <Grid item xs={12} sm={2}>
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
                      values.items?.forEach((item, idx) => {
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
                            <Stack direction="row" spacing={1}>
                              {!isEdit && (
                                <Button
                                  color="error"
                                  variant="outlined"
                                  size="small"
                                  onClick={() => remove(idx)}
                                  disabled={(values.items?.length || 1) === 1}
                                >
                                  Hapus
                                </Button>
                              )}
                              {!isEdit && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Add />}
                                  onClick={() => push({ ...defaultItem })}
                                >
                                  Tambah Baris
                                </Button>
                              )}
                            </Stack>
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
                                startAdornment={<Truck />}
                                filterParams={{ kategori: values.ctg || undefined, ctg: values.ctg || undefined }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                              <OptionOperatorDriver
                                value={item.karyawan_id}
                                name={`items[${idx}].karyawan_id`}
                                label="Operator / Driver"
                                error={itemErrors?.karyawan_id}
                                touched={itemTouched?.karyawan_id}
                                setFieldValue={setFieldValue}
                                // params={{section: 'oprdrv'}}
                                startAdornment={<TagUser />}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <OptionMaterialMining
                                value={item.material_id}
                                name={`items[${idx}].material_id`}
                                label="Material"
                                error={itemErrors?.material_id}
                                touched={itemTouched?.material_id}
                                setFieldValue={setFieldValue}
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
                                startAdornment={<Alarm />}
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
                  </Stack>
                )}
              />
            <Grid container spacing={2} mt={2}>
              <Grid item xs={12}>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Stack direction="row" gap={1}>
                    {isEdit && (
                      <Button
                        color="error"
                        variant="outlined"
                        onClick={async () => {
                          try {
                            await axiosServices.post(`/api/operation/activity-plan/${values.items?.[0]?.id || initialData.id}/destroy`);
                            openNotification({ open: true, title: 'success', message: 'Data dihapus', alert: { color: 'success' } });
                            window.location.href = backHref;
                          } catch (err) {
                            openNotification({ open: true, title: 'error', message: 'Gagal menghapus data', alert: { color: 'error' } });
                          }
                        }}
                      >
                        Hapus
                      </Button>
                    )}
                  </Stack>
                  <Stack direction="row" gap={1}>
                    <Button component={Link} href={backHref} variant="outlined" color="secondary">
                      Batal
                    </Button>
                    <Button type="submit" variant="contained" startIcon={isEdit ? <Edit /> : <Verify />} disabled={isSubmitting} onClick={() => console.log('BUTTON CLICKED')}>
                      {isEdit ? 'Simpan Perubahan' : 'Simpan'}
                    </Button>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
            </Form>
          </MainCard>
          )
        }}
      </Formik>
    </Stack>
  );
}
