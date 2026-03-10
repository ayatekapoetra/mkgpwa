"use client";

import { useParams } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

import { useShowActivityPlan } from 'api/activity-plan';
import ActivityFormPage from './FormPage';

export default function ShowDailyEquipmentActivityPage() {
  const { id } = useParams();
  const { data, dataLoading } = useShowActivityPlan(id);

  if (dataLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <ActivityFormPage mode="edit" heading="Edit Aktivitas Harian" initialData={data} />;
}
