'use client';

// REACT
import { useEffect, useState } from 'react';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CardActions from '@mui/material/CardActions';

// COMPONENTS
import MainCard from 'components/MainCard';
import SelectForm from 'components/SelectForm';
import InputForm from 'components/InputForm';

// THIRD - PARTY
import { AlignVertically, Calendar, Mobile } from 'iconsax-react';
import { Form, FieldArray } from 'formik';

// HOOK
import useDropdownOptions from 'hooks/useCustomOptions';

// API
import { useGetPrepareDo } from 'api/delivery-order';
import InputDateTime from 'components/InputDateTime';
import InputAreaForm from 'components/InputAreaForm';
import OptionPemasokDelor from 'components/OptionPemasokDelor';
import WaitOption from '../waitoption';
import TableItems from './table';

export default function FormikFormCreate({ setFieldValue, handleSubmit, handleBlur, handleChange, values, touched, errors }) {
  const { bisnisOptions, jenisItemOptions, typeKirimOptions, viaKirimOptions } = useDropdownOptions();
  console.log('errors.', errors);

  const [openOption, setOpenOption] = useState();
  const { data, mutate } = useGetPrepareDo(values.pemasok_id);

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <FormHelpers setFieldValue={setFieldValue} values={values} />
      <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
        <Grid item xs={12} sm={6} lg={6}>
          <SelectForm
            label="Bisnis Unit"
            labelId="bisnis-unit"
            name="bisnis_id"
            value={values.bisnis_id || ''}
            placeholder=""
            touched={touched}
            errors={errors}
            onBlur={handleBlur}
            onChange={handleChange}
            array={bisnisOptions}
          />
        </Grid>
        <Grid item xs={12} sm={3} lg={3}>
          <InputForm
            errors={errors}
            touched={touched}
            type={'date'}
            label={'Tanggal'}
            name={'do_date'}
            placeholder={'Tanggal'}
            value={values.do_date}
            onBlur={handleBlur}
            onChange={handleChange}
            startAdornment={<Calendar />}
          />
        </Grid>
        <Grid item xs={12} sm={3} lg={3}>
          <SelectForm
            label="Jenis"
            labelId="jenis-items"
            name="jenis"
            value={values.jenis || ''}
            placeholder=""
            touched={touched}
            errors={errors}
            onBlur={handleBlur}
            onChange={handleChange}
            array={jenisItemOptions}
          />
        </Grid>
        <Grid item xs={12} sm={3} lg={3}>
          <SelectForm
            label="Paket Pengiriman"
            labelId="paket-kirim"
            name="type"
            value={values.type || ''}
            placeholder=""
            touched={touched}
            errors={errors}
            onBlur={handleBlur}
            onChange={handleChange}
            array={typeKirimOptions}
          />
        </Grid>
        <Grid item xs={12} sm={3} lg={3}>
          <SelectForm
            label="Via Transportasi"
            labelId="via-kirim"
            name="via"
            value={values.via || ''}
            placeholder=""
            touched={touched}
            errors={errors}
            onBlur={handleBlur}
            onChange={handleChange}
            array={viaKirimOptions}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={6}>
          <OptionPemasokDelor
            value={values.pemasok_id}
            name={'pemasok_id'}
            label="Pemasok"
            error={errors.pemasok_id}
            touched={touched.pemasok_id}
            helperText={touched.pemasok_id && errors.pemasok_id}
            setFieldValue={setFieldValue}
          />
        </Grid>
        <Grid item xs={12} sm={4} lg={4}>
          <InputForm
            type={'text'}
            label={'Phone'}
            name={'phone_pemasok'}
            placeholder={'Phone'}
            value={values.pemasok?.phone || ''}
            startAdornment={<Mobile />}
          />
        </Grid>
        <Grid item xs={12} sm={8} lg={8}>
          <InputForm
            type={'text'}
            label={'Alamat Pemasok'}
            name={'alamat_pemasok'}
            placeholder={'Alamat'}
            value={values.pemasok?.alamat}
            startAdornment={<AlignVertically />}
          />
        </Grid>
        <Grid item xs={12} sm={4} lg={4}>
          <InputDateTime
            name="delivered_at"
            label="Waktu Pengiriman"
            value={values.delivered_at}
            errors={errors}
            touched={touched}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={4} lg={4}>
          <InputDateTime
            name="est_received"
            label="Estimasi Tiba"
            value={values.est_received}
            errors={errors}
            touched={touched}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={4} lg={4}>
          <InputForm
            type={'text'}
            label={'Forwarder'}
            name={'forwarder'}
            placeholder={'Forwarder'}
            touched={touched}
            errors={errors}
            value={values.forwarder}
            onChange={handleChange}
            startAdornment={<AlignVertically />}
          />
        </Grid>
        <Grid item xs={12} sm={12} lg={12}>
          <InputAreaForm
            rows={5}
            type={'text'}
            label={'Keterangan'}
            name={'narasi'}
            placeholder={'Tuliskan keterangan atau narasi'}
            touched={touched}
            errors={errors}
            value={values.narasi}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      <FieldArray name="items">
        {({ push, remove }) => {
          return (
            <>
              <WaitOption
                data={data}
                mutate={mutate}
                push={push}
                remove={remove}
                pemasok={values.pemasok_id}
                open={openOption}
                onClose={() => setOpenOption(!openOption)}
              />
              <Grid container sx={{ mt: 2 }}>
                <Grid item xs={12} sm={12} lg={12}>
                  <MainCard
                    content={false}
                    title={<Typography>List Item Pilihan</Typography>}
                    secondary={
                      values.pemasok_id && (
                        <Button onClick={() => setOpenOption(!openOption)} variant="contained" color="secondary">
                          Tambah Items
                        </Button>
                      )
                    }
                  >
                    <TableItems data={values.items} values={values} setFieldValue={setFieldValue} remove={remove} mutate={mutate} />
                  </MainCard>
                </Grid>
              </Grid>
            </>
          );
        }}
      </FieldArray>
      <CardActions sx={{ justifyContent: 'flex-start', gap: 1 }}>
        <Button type="button" variant="dashed" color="secondary">
          Cancel
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Simpan
        </Button>
      </CardActions>
    </Form>
  );
}

const FormHelpers = ({ setFieldValue, values }) => {
  useEffect(() => {
    if (values.pemasok_id) {
      setFieldValue('phone_pemasok', values.pemasok.phone);
      setFieldValue('alamat_pemasok', values.pemasok.alamat);
    }
  }, []);
  return;
};
