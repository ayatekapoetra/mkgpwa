"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';

import { Grid, Stack, Button } from '@mui/material';
import { Add, Calendar, TagUser, Truck, Alarm, Verify } from 'iconsax-react';

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

const itemSchema = Yup.object().shape({
  status: Yup.string().required('Status wajib dipilih'),
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
  ctg: Yup.string().required('Kategori equipment wajib'),
  cabang_id: Yup.string().required('Cabang wajib dipilih'),
  items: Yup.array().of(itemSchema).min(1, 'Minimal 1 baris')
});

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

function FormFields({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  setValues,
  isSubmitting,
  validateForm,
  loadMode,
  setLoadMode,
  prefetchedKey,
  backHref,
  heading
}) {
  const comboKey = `${loadMode}|${values.cabang_id || ''}|${values.ctg || ''}|${values.shift || ''}`;

  useEffect(() => {
    const hasAllFilters = values.cabang_id && values.ctg && values.shift;
    if (!hasAllFilters) return;
    if (loadMode !== 'last') return;
    if (prefetchedKey.current === comboKey) return;

    const fetchLastCreate = async () => {
      try {
        const { data } = await axiosServices.get('/api/operation/activity-plan/last-create', {
          params: {
            cabang_id: values.cabang_id,
            ctg: values.ctg,
            shift: values.shift
          }
        });

        const payload = data?.data || data;
        const sourceItems = payload?.items || payload?.rows?.items || [];

        if (Array.isArray(sourceItems) && sourceItems.length > 0) {
          const mappedItems = sourceItems.map((item) => ({
            ...defaultItem,
            id: item.id || null,
            status: item.status || 'BEROPERASI',
            equipment_id: item.equipment_id || '',
            equipment: item.equipment || null,
            karyawan_id: item.karyawan_id || '',
            kegiatan_id: item.kegiatan_id || '',
            material_id: item.material_id || '',
            lokasi_id: item.lokasi_id || '',
            lokasi_to: item.lokasi_to || '',
            keterangan: item.keterangan || ''
          }));

          const nextValues = {
            ...values,
            date_ops: payload.date_ops || values.date_ops,
            shift: payload.shift || values.shift,
            ctg: payload.ctg || values.ctg,
            cabang_id: payload.cabang_id || values.cabang_id,
            items: mappedItems
          };

          setValues(nextValues, false);
          setFieldValue('items', mappedItems, false);
        } else {
          openNotification({
            open: true,
            title: 'info',
            message: 'Data terakhir tidak ditemukan',
            alert: { color: 'warning' }
          });
          setFieldValue('items', [], false);
        }
      } catch (err) {
        console.error('Gagal mengambil data terakhir', err);
      } finally {
        prefetchedKey.current = comboKey;
      }
    };

    fetchLastCreate();
  }, [comboKey, loadMode, prefetchedKey, setFieldValue, setValues, values]);

  const handleModeChange = useCallback(
    (mode) => {
      setLoadMode(mode);
      prefetchedKey.current = null;
      if (mode === 'manual') {
        setFieldValue('items', [defaultItem], false);
      } else if (mode === 'last') {
        setFieldValue('items', [], false);
      }
    },
    [prefetchedKey, setFieldValue, setLoadMode]
  );

  return (
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
                handleChange({ target: { name: 'date_ops', value: e.target.value } });
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
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
              <Button
                variant={loadMode === 'manual' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => handleModeChange('manual')}
              >
                Input Manual
              </Button>
              <Button
                variant={loadMode === 'last' ? 'contained' : 'outlined'}
                color="secondary"
                onClick={() => handleModeChange('last')}
                disabled={!values.cabang_id || !values.ctg || !values.shift}
              >
                Load Data Terakhir
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {loadMode && (
          <FieldArray
            name="items"
            render={({ push, remove }) => (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {values.items?.map((item, idx) => {
                  const itemErrors = errors.items?.[idx] || {};
                  const itemTouched = touched.items?.[idx] || {};

                  const allowAddRemove = loadMode === 'manual';

                  return (
                    <MainCard
                      key={idx}
                      title={`Data #${idx + 1}`}
                      secondary={
                        <Stack direction="row" spacing={1}>
                          <Button
                            color="error"
                            variant="outlined"
                            size="small"
                            onClick={() => remove(idx)}
                            disabled={(values.items?.length || 1) === 1}
                          >
                            Hapus
                          </Button>
                          {allowAddRemove && (
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
        )}

        {values.items?.length > 0 && (
          <Grid container spacing={2} mt={2}>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end" gap={1}>
                <Button component={Link} href={backHref} variant="outlined" color="secondary">
                  Batal
                </Button>
                <Button type="submit" variant="contained" startIcon={<Verify />} disabled={isSubmitting}>
                  Simpan
                </Button>
              </Stack>
            </Grid>
          </Grid>
        )}
      </Form>
    </MainCard>
  );
}

export default function CreateFormPage({
  heading = 'Aktivitas Harian',
  breadcrumbHeading,
  breadcrumbLinks: breadcrumbLinksProp,
  backHref = '/daily-equipment-activity'
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [loadMode, setLoadMode] = useState(null); // null | 'manual' | 'last'
  
  const prefetchedKey = useRef(null);

  const initialValues = useMemo(() => ({
    date_ops: todayStr,
    shift: 'PAGI',
    ctg: 'DT',
    cabang_id: '',
    items: [defaultItem]
  }), [todayStr]);

  const breadcrumbLinks =
    breadcrumbLinksProp || [
      { title: 'Home', to: APP_DEFAULT_PATH },
      { title: 'Daily Equipment Activity', to: '/daily-equipment-activity' },
      { title: 'Create', to: '#' }
    ];

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const cleanPayload = (obj) => {
        const cleaned = {};
        Object.keys(obj).forEach((key) => {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') cleaned[key] = obj[key];
        });
        return cleaned;
      };

      const payload = {
        date_ops: values.date_ops,
        shift: values.shift,
        ctg: values.ctg,
        cabang_id: values.cabang_id,
        items: values.items.map((item) =>
          cleanPayload({
            status: item.status,
            equipment_id: item.equipment_id,
            karyawan_id: item.karyawan_id,
            kegiatan_id: item.kegiatan_id,
            material_id: item.material_id,
            lokasi_id: item.lokasi_id,
            lokasi_to: item.lokasi_to,
            keterangan: item.keterangan
          })
        )
      };

      await axiosServices.post('/api/operation/activity-plan/create', payload);

      openNotification({ open: true, title: 'success', message: 'Data tersimpan', alert: { color: 'success' } });
      window.location.href = backHref;
    } catch (error) {
      console.log(error);
      
      openNotification({
        open: true,
        title: 'error',
        message: error?.diagnostic?.error || error?.response?.data?.message || error?.message || 'Gagal menyimpan data',
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
        validationSchema={schemaEntries}
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
              if (!item.status) errors[`items[${idx}].status`] = 'Status wajib dipilih';
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
        {(formikProps) => (
          <FormFields
            {...formikProps}
            loadMode={loadMode}
            setLoadMode={setLoadMode}
            prefetchedKey={prefetchedKey}
            backHref={backHref}
            heading={heading}
          />
        )}
      </Formik>
    </Stack>
  );
}
