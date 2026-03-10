"use client";

import { useState } from 'react';
import Link from 'next/link';

import { Stack, Button, Box } from '@mui/material';
import { Add, Filter, Refresh } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { useActivityPlan } from 'api/activity-plan';
import { openNotification } from 'api/notification';

import ListActivity from './list';
import FilterActivity from './filter';
import ActivityForm from './form';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Operational', to: '#' },
  { title: 'Daily Equipment Activity', to: '/daily-equipment-activity' }
];

const defaultParams = {
  page: 1,
  perPage: 25,
  date_ops: '',
  shift: '',
  status: '',
  ctg: '',
  equipment_id: '',
  karyawan_id: '',
  kegiatan_id: '',
  lokasi_id: '',
  lokasi_to: '',
  cabang_id: '',
  aktif: 'Y'
};

export default function DailyEquipmentActivity() {
  const [params, setParams] = useState(defaultParams);
  const [openFilter, setOpenFilter] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, dataLoading, dataError, mutate } = useActivityPlan(params);

  const handleRefresh = () => mutate();

  const handleCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleEdit = (row) => {
    setEditing(row);
    setOpenForm(true);
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    setEditing(null);
    mutate();
    openNotification({ open: true, title: 'success', message: 'Data tersimpan', alert: { color: 'success' } });
  };

  return (
    <Stack spacing={2}>
      <Breadcrumbs heading="Daily Equipment Activity" links={breadcrumbLinks} />

      <MainCard
        title="Aktivitas Harian Equipment"
        secondary={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="secondary" startIcon={<Filter />} onClick={() => setOpenFilter(true)}>
              Filter
            </Button>
            <Button variant="outlined" color="primary" startIcon={<Refresh />} onClick={handleRefresh}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
              Tambah Aktivitas
            </Button>
          </Stack>
        }
        content
      >
        <ListActivity
          data={data}
          loading={dataLoading}
          error={dataError}
          params={params}
          setParams={setParams}
          onEdit={handleEdit}
        />
      </MainCard>

      <FilterActivity open={openFilter} onClose={() => setOpenFilter(false)} params={params} setParams={setParams} />

      <ActivityForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSuccess={handleFormSuccess}
        initialData={editing}
      />
    </Stack>
  );
}
