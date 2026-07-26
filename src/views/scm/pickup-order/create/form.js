'use client';

import { useMemo, useState } from 'react';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CardActions from '@mui/material/CardActions';

import MainCard from 'components/MainCard';
import SelectForm from 'components/SelectForm';
import InputForm from 'components/InputForm';
import InputAreaForm from 'components/InputAreaForm';
import OptionUser from 'components/OptionUser';

import { Calendar, DocumentUpload, Profile2User, TruckTick, UserSquare } from 'iconsax-react';
import { FieldArray, Form } from 'formik';

import { useGetGudang } from 'api/gudang';
import { useGetReadyPickup } from 'api/delivery-order';
import WaitOption from './waitoption';
import TableItems from './table';

const priorityOptions = [
  { key: 'P1', teks: 'P1' },
  { key: 'P2', teks: 'P2' },
  { key: 'P3', teks: 'P3' }
];

export default function FormikFormCreate({ setFieldValue, handleSubmit, handleBlur, handleChange, values, touched, errors }) {
  const [openOption, setOpenOption] = useState(false);
  const { data: gudangRows } = useGetGudang();
  const { data: readyPickupRows = [], dataLoading } = useGetReadyPickup(values.items.map((item) => item.doitemid || item.id), openOption);

  const gudangOptions = useMemo(
    () => (gudangRows || []).map((item) => ({ key: item.id, teks: `${item.kode} - ${item.nama}` })),
    [gudangRows]
  );

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
        <Grid item xs={12} sm={3} lg={3}>
          <InputForm
            errors={errors}
            touched={touched}
            type={'date'}
            label={'Tanggal Pickup'}
            name={'date_pickup'}
            value={values.date_pickup}
            onBlur={handleBlur}
            onChange={handleChange}
            startAdornment={<Calendar />}
          />
        </Grid>
        <Grid item xs={12} sm={5} lg={5}>
          <InputForm
            type={'text'}
            label={'Pickup By'}
            name={'pickup_by'}
            placeholder={'Nama petugas pickup'}
            touched={touched}
            errors={errors}
            value={values.pickup_by}
            onBlur={handleBlur}
            onChange={handleChange}
            startAdornment={<TruckTick />}
          />
        </Grid>
        <Grid item xs={12} sm={4} lg={4}>
          <SelectForm
            label="Prioritas"
            labelId="prioritas-pickup"
            name="prioritas"
            value={values.prioritas || 'P1'}
            touched={touched}
            errors={errors}
            onBlur={handleBlur}
            onChange={handleChange}
            array={priorityOptions}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={6}>
          <SelectForm
            label="Gudang Transit"
            labelId="gudang-transit"
            name="drop_to"
            value={values.drop_to || ''}
            touched={touched}
            errors={errors}
            onBlur={handleBlur}
            onChange={handleChange}
            array={gudangOptions}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={6}>
          <OptionUser
            value={values.accepted_by}
            name={'accepted_by'}
            label="Accepted By"
            objField="acceptedby"
            error={errors.accepted_by}
            touched={touched.accepted_by}
            setFieldValue={setFieldValue}
            startAdornment={<Profile2User />}
          />
        </Grid>
        <Grid item xs={12} sm={12} lg={12}>
          <InputAreaForm
            rows={4}
            type={'text'}
            label={'Keterangan Pickup'}
            name={'keterangan'}
            placeholder={'Tuliskan keterangan pickup'}
            touched={touched}
            errors={errors}
            value={values.keterangan}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={6}>
          <Button component="label" variant="dashed" color="secondary" startIcon={<DocumentUpload />} fullWidth>
            {values.photo ? values.photo.name : 'Upload Photo (opsional)'}
            <input
              hidden
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0] || null;
                setFieldValue('photo', file);
              }}
            />
          </Button>
        </Grid>
      </Grid>
      <FieldArray name="items">
        {({ push, remove }) => (
          <>
            <WaitOption
              data={readyPickupRows}
              dataLoading={dataLoading}
              push={push}
              remove={remove}
              selectedItems={values.items}
              open={openOption}
              onClose={() => setOpenOption(false)}
            />
            <Grid container sx={{ mt: 2 }}>
              <Grid item xs={12} sm={12} lg={12}>
                <MainCard
                  content={false}
                  title={<Typography>List Item Pickup</Typography>}
                  secondary={
                    <Button onClick={() => setOpenOption(true)} variant="contained" color="secondary" startIcon={<UserSquare />}>
                      Pilih Items
                    </Button>
                  }
                >
                  <TableItems data={values.items} setFieldValue={setFieldValue} remove={remove} />
                </MainCard>
              </Grid>
            </Grid>
          </>
        )}
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
