'use client';

import { Fragment, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import Autocomplete from '@mui/material/Autocomplete';
import OptionCabang from 'components/OptionCabang';
import OptionEquipment from 'components/OptionEquipment';
import OptionPenyewa from 'components/OptionPenyewa';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useGetKaryawan } from 'api/karyawan';
import { createEquipmentMobilization, useEquipmentMobilizationAccess } from 'api/equipment-mobilization';

moment.locale('id');

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Equipment Mobilization', to: '/mobilisasi-equipments' },
  { title: 'Create' }
];

const PENGANTAR_SECTION_RULES = [
  'pengawas',
  'koordinator',
  'driver *',
  'operator',
  'checker',
  'fuelman',
  'helper *'
];

const isPengantarSectionAllowed = (section) => {
  const value = String(section || '').trim().toLowerCase();
  if (!value) return false;
  return PENGANTAR_SECTION_RULES.some((rule) => {
    const normalized = String(rule || '').trim().toLowerCase();
    if (normalized.endsWith('*')) {
      const prefix = normalized.slice(0, -1).trim();
      return prefix ? value.startsWith(prefix) : false;
    }
    return value === normalized;
  });
};

const validationSchema = Yup.object().shape({
  started_at: Yup.string().required('Waktu mulai wajib diisi'),
  origin_branch_id: Yup.mixed().required('Cabang asal wajib dipilih'),
  destination_branch_id: Yup.mixed().required('Cabang tujuan wajib dipilih'),
  origin_tenant_id: Yup.mixed().required('Penyewa asal wajib dipilih'),
  destination_tenant_id: Yup.mixed().required('Penyewa tujuan wajib dipilih'),
  save_as: Yup.string().oneOf(['draft', 'open']).required(),
  notes: Yup.string().nullable(),
  items: Yup.array()
    .of(
      Yup.object().shape({
        equipment_id: Yup.mixed().required('Equipment wajib dipilih'),
        karyawan_id: Yup.mixed().nullable()
      })
    )
    .min(1, 'Minimal 1 equipment')
});

const initialValues = {
  started_at: moment().format('YYYY-MM-DDTHH:mm'),
  origin_branch_id: '',
  destination_branch_id: '',
  origin_tenant_id: '',
  destination_tenant_id: '',
  notes: '',
  save_as: 'open',
  items: [{ equipment_id: '', karyawan_id: '' }]
};

export default function EquipmentMobilizationCreatePage() {
  const router = useRouter();
  const { permissions, accessLoading } = useEquipmentMobilizationAccess();
  const { data: karyawanList = [], dataLoading: karyawanLoading } = useGetKaryawan();
  const [submitting, setSubmitting] = useState(false);

  const canCreate = !accessLoading && permissions?.can_insert !== false;

  const pengantarOptions = useMemo(() => {
    const list = Array.isArray(karyawanList) ? karyawanList : [];
    return list
      .filter((item) => isPengantarSectionAllowed(item?.section || item?.jabatan || item?.position))
      .sort((a, b) => String(a?.nama || '').localeCompare(String(b?.nama || ''), 'id', { sensitivity: 'base' }));
  }, [karyawanList]);

  if (!accessLoading && !canCreate) {
    return <Alert severity="warning">Anda tidak memiliki akses membuat dokumen mobilisasi.</Alert>;
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      if (
        String(values.origin_branch_id) === String(values.destination_branch_id)
        && String(values.origin_tenant_id) === String(values.destination_tenant_id)
      ) {
        throw new Error('Asal dan tujuan mobilisasi tidak boleh sama');
      }

      const equipmentIds = values.items.map((item) => Number(item.equipment_id));
      if (new Set(equipmentIds).size !== equipmentIds.length) {
        throw new Error('Equipment duplikat dalam dokumen tidak diperbolehkan');
      }

      const startedAt = moment(values.started_at);
      if (!startedAt.isValid()) throw new Error('Waktu mulai tidak valid');

      const payload = {
        started_at: startedAt.format('YYYY-MM-DD HH:mm:ss'),
        movement_date: startedAt.format('YYYY-MM-DD'),
        origin_branch_id: Number(values.origin_branch_id),
        destination_branch_id: Number(values.destination_branch_id),
        origin_tenant_id: Number(values.origin_tenant_id),
        destination_tenant_id: Number(values.destination_tenant_id),
        notes: values.notes?.trim() || null,
        save_as: values.save_as === 'open' ? 'open' : 'draft',
        request_id: `web-mob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        items: values.items.map((item) => ({
          equipment_id: Number(item.equipment_id),
          karyawan_id: item.karyawan_id ? Number(item.karyawan_id) : null
        }))
      };

      const created = await createEquipmentMobilization(payload);
      openNotification({
        open: true,
        title: 'success',
        message: `Dokumen ${created?.document_no || created?.id || ''} berhasil dibuat`,
        alert: { color: 'success' }
      });
      router.push(`/mobilisasi-equipments/${created.id}`);
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.message || 'Gagal membuat dokumen mobilisasi',
        alert: { color: 'error' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Buat Equipment Mobilization" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/mobilisasi-equipments" />}>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, setFieldValue }) => (
              <Box component="form" onSubmit={formikSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Waktu Mulai Mobilisasi"
                      name="started_at"
                      value={values.started_at}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      InputLabelProps={{ shrink: true }}
                      error={touched.started_at && Boolean(errors.started_at)}
                      helperText={touched.started_at && errors.started_at}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <OptionCabang
                      label="Cabang Asal"
                      name="origin_branch_id"
                      value={values.origin_branch_id}
                      setFieldValue={setFieldValue}
                      error={errors.origin_branch_id}
                      touched={touched.origin_branch_id}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <OptionCabang
                      label="Cabang Tujuan"
                      name="destination_branch_id"
                      value={values.destination_branch_id}
                      setFieldValue={setFieldValue}
                      error={errors.destination_branch_id}
                      touched={touched.destination_branch_id}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <OptionPenyewa
                      label="Penyewa Asal"
                      name="origin_tenant_id"
                      value={values.origin_tenant_id}
                      setFieldValue={setFieldValue}
                      error={errors.origin_tenant_id}
                      touched={touched.origin_tenant_id}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <OptionPenyewa
                      label="Penyewa Tujuan"
                      name="destination_tenant_id"
                      value={values.destination_tenant_id}
                      setFieldValue={setFieldValue}
                      error={errors.destination_tenant_id}
                      touched={touched.destination_tenant_id}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Catatan"
                      name="notes"
                      value={values.notes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>Mode Penyimpanan</Divider>
                    <FormControl>
                      <RadioGroup
                        row
                        name="save_as"
                        value={values.save_as}
                        onChange={handleChange}
                      >
                        <FormControlLabel value="draft" control={<Radio />} label="Draft (bisa diedit dulu)" />
                        <FormControlLabel value="open" control={<Radio />} label="Open (siap diproses)" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>Daftar Equipment</Divider>
                    {typeof errors.items === 'string' && (
                      <FormHelperText error sx={{ mb: 1 }}>{errors.items}</FormHelperText>
                    )}
                    <FieldArray name="items">
                      {({ push, remove }) => (
                        <Stack spacing={2}>
                          {values.items.map((item, index) => (
                            <Box
                              key={`item-${index}`}
                              sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                <Typography variant="subtitle2">Unit #{index + 1}</Typography>
                                <IconButton
                                  color="error"
                                  disabled={values.items.length <= 1}
                                  onClick={() => remove(index)}
                                >
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </Stack>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <OptionEquipment
                                    label="Equipment"
                                    name={`items.${index}.equipment_id`}
                                    value={item.equipment_id}
                                    setFieldValue={(name, value) => setFieldValue(name, value)}
                                    error={errors.items?.[index]?.equipment_id}
                                    touched={touched.items?.[index]?.equipment_id}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Autocomplete
                                    options={pengantarOptions}
                                    loading={karyawanLoading}
                                    value={pengantarOptions.find((opt) => String(opt.id) === String(item.karyawan_id)) || null}
                                    onChange={(_e, newValue) => setFieldValue(`items.${index}.karyawan_id`, newValue?.id || '')}
                                    getOptionLabel={(option) => option?.nama || ''}
                                    isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                                    renderOption={(props, option) => (
                                      <li {...props} key={option.id}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                          <Typography variant="body2" fontWeight={700}>{option.nama}</Typography>
                                          <Typography variant="caption" color="text.secondary">{option.section || '-'}</Typography>
                                        </Box>
                                      </li>
                                    )}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        label="Karyawan Pengantar (opsional)"
                                        placeholder="Pilih pengantar"
                                      />
                                    )}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                          <Button
                            startIcon={<AddIcon />}
                            variant="outlined"
                            onClick={() => push({ equipment_id: '', karyawan_id: '' })}
                          >
                            Tambah Equipment
                          </Button>
                        </Stack>
                      )}
                    </FieldArray>
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                      <Button variant="outlined" color="secondary" onClick={() => router.push('/mobilisasi-equipments')}>
                        Batal
                      </Button>
                      <Button type="submit" variant="contained" disabled={submitting}>
                        {submitting
                          ? 'Menyimpan...'
                          : values.save_as === 'open'
                            ? 'Simpan & Open Dokumen'
                            : 'Simpan Draft'}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
          )}
        </Formik>
      </MainCard>
    </Fragment>
  );
}
