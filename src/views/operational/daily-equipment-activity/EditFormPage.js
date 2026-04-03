"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Formik, Form, FieldArray } from 'formik';
import moment from 'moment';

import { Grid, Stack, Button } from '@mui/material';
import { Edit, Calendar, TagUser, Truck, Alarm } from 'iconsax-react';

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

const defaultItem = {
  id: null,
  status: 'BEROPERASI',
  equipment_id: '',
  equipment: null,
  karyawan_id: '',
  kegiatan_id: '',
  material_id: '',
  lokasi_id: '',
  lokasi_to: '',
  keterangan: ''
};

export default function EditFormPage({
  initialData = {},
  heading = 'Aktivitas Harian',
  breadcrumbHeading,
  breadcrumbLinks: breadcrumbLinksProp,
  backHref = '/daily-equipment-activity'
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const initialValues = useMemo(() => {
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return moment(dateStr).format('YYYY-MM-DD');
    };

    if (initialData && initialData.id) {
      return {
        date_ops: formatDate(initialData.date_ops || todayStr),
        shift: initialData.shift || 'PAGI',
        ctg: initialData.ctg || initialData?.equipment?.kategori || initialData?.equipment?.ctg || '',
        cabang_id: initialData.cabang_id || initialData?.equipment?.cabang_id || '',
        items: [
          {
            ...defaultItem,
            id: initialData.id,
            status: initialData.status || 'BEROPERASI',
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
      ctg: 'DT',
      cabang_id: '',
      items: [defaultItem]
    };
  }, [initialData, todayStr]);

  const breadcrumbLinks =
    breadcrumbLinksProp || [
      { title: 'Home', to: APP_DEFAULT_PATH },
      { title: 'Daily Equipment Activity', to: '/daily-equipment-activity' },
      { title: 'Edit', to: '#' }
    ];

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const cleanPayload = (obj) => {
        const cleaned = {};
        Object.keys(obj).forEach((key) => {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            cleaned[key] = obj[key];
          }
        });
        return cleaned;
      };

      const common = cleanPayload({
        date_ops: values.date_ops,
        shift: values.shift,
        ctg: values.ctg,
        cabang_id: values.cabang_id
      });

      const [item] = values.items;
      const payload = {
        ...common,
        ...cleanPayload({
          id: item.id,
          status: item.status,
          equipment_id: item.equipment_id,
          karyawan_id: item.karyawan_id,
          kegiatan_id: item.kegiatan_id,
          material_id: item.material_id,
          lokasi_id: item.lokasi_id,
          lokasi_to: item.lokasi_to,
          keterangan: item.keterangan
        })
      };

      await axiosServices.post(`/api/operation/activity-plan/${item.id}/update`, payload);

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
          const errors = {};
          if (!vals.date_ops) errors.date_ops = 'Tanggal wajib diisi';
          if (!vals.shift) errors.shift = 'Shift wajib diisi';
          if (!vals.ctg) errors.ctg = 'Kategori equipment wajib';
          if (!vals.cabang_id) errors.cabang_id = 'Cabang wajib dipilih';

          if (!vals.items || vals.items.length === 0) {
            errors.items = 'Minimal 1 baris';
          } else {
            vals.items.forEach((item, idx) => {
              if (!item.equipment_id) errors[`items[${idx}].equipment_id`] = 'Equipment wajib dipilih';
              if (!item.lokasi_id) errors[`items[${idx}].lokasi_id`] = 'Lokasi wajib dipilih';
              if (item.status === 'BEROPERASI' && !item.material_id) {
                errors[`items[${idx}].material_id`] = 'Material wajib dipilih untuk status BEROPERASI';
              }
            });
          }

          if (Object.keys(errors).length > 0) {
            helpers.setErrors(errors);
            helpers.setSubmitting(false);
            openNotification({ open: true, title: 'error', message: 'Lengkapi field wajib', alert: { color: 'error' } });
            return;
          }

          return handleSubmit(vals, helpers);
        }}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting, validateForm }) => (
          <MainCard title={heading} content>
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3} mb={2}>
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
                          value
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
                <Grid item xs={12} sm={3}>
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
              </Grid>

              <FieldArray
                name="items"
                render={() => (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {values.items?.map((item, idx) => {
                      const itemErrors = errors.items?.[idx] || {};
                      const itemTouched = touched.items?.[idx] || {};

                      return (
                        <MainCard key={idx} title={`Data #${idx + 1}`} content>
                          <Grid container spacing={1.5} mb={2}>
                            <Grid item xs={12} sm={3}>
                              <SelectForm
                                array={statusOptions}
                                label="Status"
                                name={`items[${idx}].status`}
                                value={item.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  setFieldValue(`items[${idx}].status`, newStatus);
                                  const needLokasiTo = values.ctg !== 'HE' && newStatus === 'BEROPERASI';
                                  if (!needLokasiTo) {
                                    setFieldValue(`items[${idx}].lokasi_to`, '');
                                  }
                                }}
                                onBlur={() => validateForm()}
                                touched={itemTouched?.status}
                                errors={itemErrors?.status}
                              />
                            </Grid>
                          </Grid>
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
                                disabled={values.ctg === 'HE' || item.status !== 'BEROPERASI'}
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
                    </Stack>
                    <Stack direction="row" gap={1}>
                      <Button component={Link} href={backHref} variant="outlined" color="secondary">
                        Batal
                      </Button>
                      <Button type="submit" variant="contained" startIcon={<Edit />} disabled={isSubmitting}>
                        Simpan Perubahan
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Form>
          </MainCard>
        )}
      </Formik>
    </Stack>
  );
}
