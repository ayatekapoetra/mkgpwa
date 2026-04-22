'use client';

import Link from 'next/link';

import { Button, CardActions, Grid } from '@mui/material';
import { Building, Calendar, Location, Profile2User, Send2, Trash } from 'iconsax-react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import MainCard from 'components/MainCard';
import BtnBack from 'components/BtnBack';
import InputForm from 'components/InputForm';
import OptionBisnisUnit from 'components/OptionBisnisUnit';
import OptionPenyewa from 'components/OptionPenyewa';
import OptionLokasiPit from 'components/OptionLokasiPit';
import OptionMaterialMining from 'components/OptionMaterialMining';

const validationSchema = Yup.object({
  contractor_id: Yup.number().typeError('Contractor wajib dipilih').required('Contractor wajib dipilih'),
  periode: Yup.string()
    .matches(/^(19|20)\d{2}(0[1-9]|1[0-2])$/, 'Periode wajib format YYYYMM')
    .required('Periode wajib diisi'),
  lokasi_id: Yup.number().typeError('Lokasi wajib dipilih').required('Lokasi wajib dipilih'),
  material_id: Yup.number().typeError('Material wajib dipilih').required('Material wajib dipilih'),
  valueplan: Yup.number().typeError('Value plan wajib angka').min(0, 'Value plan minimal 0').required('Value plan wajib diisi')
});

export default function MiningProductionPlanForm({
  initialValues,
  loading = false,
  onSubmit,
  submitLabel = 'Simpan',
  onDelete,
  onReactivate
}) {
  return (
    <MainCard title={<BtnBack href="/mining-production-plan" />} content>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const payload = {
            ...values,
            contractor_id: values.contractor_id || '',
            iupowner_id: values.iupowner_id || null,
            lokasi_id: values.lokasi_id || '',
            material_id: values.material_id || '',
            valueplan: Number(values.valueplan || 0)
          };

          try {
            await onSubmit(payload);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, values, handleChange, handleSubmit, isSubmitting, setFieldValue }) => (
          <Form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <InputForm
                  label="Periode (YYYYMM)"
                  name="periode"
                  value={values.periode}
                  onChange={handleChange}
                  errors={errors}
                  touched={touched}
                  startAdornment={<Calendar size={16} />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <OptionBisnisUnit
                  value={values.contractor_id}
                  name="contractor_id"
                  label="Contractor"
                  error={errors.contractor_id}
                  touched={Boolean(touched.contractor_id)}
                  startAdornment={<Building size={16} />}
                  setFieldValue={setFieldValue}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <OptionPenyewa
                  value={values.iupowner_id}
                  name="iupowner_id"
                  label="IUP Owner (Opsional)"
                  error={errors.iupowner_id}
                  touched={Boolean(touched.iupowner_id)}
                  startAdornment={<Profile2User size={16} />}
                  setFieldValue={setFieldValue}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <OptionLokasiPit
                  value={values.lokasi_id}
                  name="lokasi_id"
                  label="Lokasi"
                  error={errors.lokasi_id}
                  touched={Boolean(touched.lokasi_id)}
                  startAdornment={<Location size={16} />}
                  setFieldValue={setFieldValue}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <OptionMaterialMining
                  value={values.material_id}
                  name="material_id"
                  label="Material"
                  error={errors.material_id}
                  touched={Boolean(touched.material_id)}
                  startAdornment={<Location size={16} />}
                  setFieldValue={setFieldValue}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <InputForm
                  label="Value Plan (MT)"
                  type="number"
                  name="valueplan"
                  value={values.valueplan}
                  onChange={handleChange}
                  errors={errors}
                  touched={touched}
                  min={0}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <InputForm
                  multiline
                  rows={5}
                  label="Narasi"
                  name="narasi"
                  value={values.narasi}
                  onChange={handleChange}
                  errors={errors}
                  touched={touched}
                />
              </Grid>

              <Grid item xs={12}>
                <CardActions>
                  <Button component={Link} href="/mining-production-plan" variant="outlined" color="secondary">
                    Batal
                  </Button>
                  {onDelete && (
                    <Button variant="outlined" color="error" startIcon={<Trash />} onClick={onDelete}>
                      Nonaktifkan
                    </Button>
                  )}
                  {onReactivate && (
                    <Button variant="outlined" color="success" onClick={onReactivate}>
                      Aktifkan Kembali
                    </Button>
                  )}
                  <Button type="submit" variant="contained" startIcon={<Send2 />} disabled={isSubmitting || loading}>
                    {submitLabel}
                  </Button>
                </CardActions>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </MainCard>
  );
}
