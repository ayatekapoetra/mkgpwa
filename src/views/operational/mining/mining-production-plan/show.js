'use client';

import { Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Alert, Box, CircularProgress } from '@mui/material';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  deleteMiningProductionPlan,
  reactivateMiningProductionPlan,
  updateMiningProductionPlan,
  useShowMiningProductionPlan
} from 'api/mining-production-plan';

import MiningProductionPlanForm from './form';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Mining Production Plan', to: '/mining-production-plan' },
  { title: 'Edit' }
];

export default function MiningProductionPlanShowPage() {
  const router = useRouter();
  const { id } = useParams();
  const { row, rowLoading, rowError, mutate } = useShowMiningProductionPlan(id);

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
      await updateMiningProductionPlan(id, payload);
      notifySuccess('Mining production plan berhasil diperbarui.');
      router.push('/mining-production-plan');
    } catch (error) {
      const message = error?.diagnostic?.message || error?.message || 'Gagal memperbarui mining production plan.';
      notifyError(message);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Yakin ingin menonaktifkan mining production plan ini?');
    if (!ok) return;

    try {
      await deleteMiningProductionPlan(id);
      notifySuccess('Mining production plan berhasil dinonaktifkan.');
      router.push('/mining-production-plan');
    } catch (error) {
      const message = error?.diagnostic?.message || error?.message || 'Gagal menonaktifkan mining production plan.';
      notifyError(message);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMiningProductionPlan(id);
      await mutate();
      notifySuccess('Mining production plan berhasil diaktifkan kembali.');
    } catch (error) {
      const message = error?.diagnostic?.message || error?.message || 'Gagal mengaktifkan kembali mining production plan.';
      notifyError(message);
    }
  };

  if (rowLoading) {
    return (
      <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <Fragment>
      <Breadcrumbs custom heading="Edit Mining Production Plan" links={breadcrumbLinks} />
      {rowError && <Alert severity="warning" sx={{ mb: 2 }}>Gagal memuat detail mining production plan.</Alert>}
      <MiningProductionPlanForm
        initialValues={{
          contractor_id: row?.contractor_id || '',
          iupowner_id: row?.iupowner_id || '',
          periode: row?.periode || '',
          lokasi_id: row?.lokasi_id || '',
          material_id: row?.material_id || '',
          valueplan: row?.valueplan || 0,
          narasi: row?.narasi || ''
        }}
        onSubmit={handleSubmit}
        onDelete={String(row?.aktif || 'Y') === 'Y' ? handleDelete : null}
        onReactivate={String(row?.aktif || 'Y') === 'N' ? handleReactivate : null}
        submitLabel="Update"
      />
    </Fragment>
  );
}
