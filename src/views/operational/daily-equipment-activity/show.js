"use client";

import { useParams } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

import { useShowActivityPlan } from 'api/activity-plan';
import EditFormPage from './EditFormPage';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';

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

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Activity Equipment', to: '/daily-equipment-activity' },
    { title: 'Show', to: '#' }
  ];

  return (
    <EditFormPage
      heading={<BtnBack href={'/daily-equipment-activity'} />}
      breadcrumbHeading="Daily Equipment Activity"
      breadcrumbLinks={breadcrumbLinks}
      initialData={data}
    />
  );
}
