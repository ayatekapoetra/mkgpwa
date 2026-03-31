"use client";

import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import ActivityFormPage from './FormPage';

export default function CreateDailyEquipmentActivityPage() {
  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Activity Equipment', to: '/daily-equipment-activity' },
    { title: 'Create', to: '#' }
  ];

  return (
    <ActivityFormPage
      mode="create"
      heading={<BtnBack href={'/daily-equipment-activity'} />}
      breadcrumbHeading="Daily Equipment Activity"
      breadcrumbLinks={breadcrumbLinks}
    />
  );
}
