"use client";

import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import CreateFormPage from './CreateFormPage';

export default function CreateDailyEquipmentActivityPage() {
  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Activity Equipment', to: '/daily-equipment-activity' },
    { title: 'Create', to: '#' }
  ];

  return (
    <CreateFormPage
      heading={<BtnBack href={'/daily-equipment-activity'} />}
      breadcrumbHeading="Daily Equipment Activity"
      breadcrumbLinks={breadcrumbLinks}
    />
  );
}
