'use client';

import { Fragment, useState } from 'react';

import { Stack, Grid } from '@mui/material';

// COMPONENTS
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import InputRadio from 'components/InputRadio';

// HOOK
// import useUser from 'hooks/useUser';
import CreateEquipmentTask from './create/equipment-task';
import CreateEmployeeTask from './create/employee-task';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Penugasan Kerja', to: '/penugasan-kerja' },
  { title: 'Create' }
];

export default function CreatePenugasanKerja() {
  const [typeForm, setTypeForm] = useState('equipment');
  return (
    <Fragment>
      <Breadcrumbs custom heading={'Create Tugas Kerja'} links={breadcrumbLinks} />
      <MainCard title={<BtnBack href={'/penugasan-kerja'} />} secondary={null} content={true}>
        <Grid container spacing={3} alignItems="flex-start" justifyContent="flex-start">
          <Grid item xs={12} sm={4}>
            <InputRadio
              name="type"
              label="Type Penugasan"
              value={typeForm}
              onChange={(e, val) => {
                setTypeForm(val);
              }}
              array={[
                { value: 'equipment', teks: 'Equipment' },
                { value: 'karyawan', teks: 'Karyawan' }
              ]}
            />
          </Grid>
        </Grid>
        {typeForm == 'equipment' ? (
          <Stack sx={{ pt: 4 }}>
            <CreateEquipmentTask type={typeForm} />
          </Stack>
        ) : (
          <Stack sx={{ pt: 4 }}>
            <CreateEmployeeTask type={typeForm} />
          </Stack>
        )}
      </MainCard>
    </Fragment>
  );
}
