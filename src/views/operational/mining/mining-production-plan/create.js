'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { createMiningProductionPlan } from 'api/mining-production-plan';

import MiningProductionPlanForm from './form';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Mining Production Plan', to: '/mining-production-plan' },
  { title: 'Create' }
];

const initialValues = {
  contractor_id: '',
  iupowner_id: '',
  periode: '',
  lokasi_id: '',
  material_id: '',
  valueplan: 0,
  narasi: ''
};

export default function MiningProductionPlanCreatePage() {
  const router = useRouter();

  const notifySuccess = (message) => {
    openNotification({
      open: true,
      title: 'success',
      message,
      alert: { color: 'success' }
    });
  };

  const notifyError = (message) => {
    openNotification({
      open: true,
      title: 'error',
      message,
      alert: { color: 'error' }
    });
  };

  const handleSubmit = async (payload) => {
    try {
      await createMiningProductionPlan(payload);
      notifySuccess('Mining production plan berhasil dibuat.');
      router.push('/mining-production-plan');
    } catch (error) {
      const message = error?.diagnostic?.message || error?.message || 'Gagal membuat mining production plan.';
      notifyError(message);
    }
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Create Mining Production Plan" links={breadcrumbLinks} />
      <MiningProductionPlanForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Simpan" />
    </Fragment>
  );
}
