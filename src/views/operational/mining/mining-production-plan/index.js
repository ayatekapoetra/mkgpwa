'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import { Add, Filter } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import Paginate from 'components/Paginate';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  deleteMiningProductionPlan,
  reactivateMiningProductionPlan,
  useGetMiningProductionPlan
} from 'api/mining-production-plan';

import MiningProductionPlanFilter from './filter';
import MiningProductionPlanList from './list';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Mining Production Plan', to: '/mining-production-plan' }
];

const defaultParams = {
  page: 1,
  per_page: 25,
  periode: '',
  contractor_id: '',
  iupowner_id: '',
  lokasi_id: '',
  material_id: '',
  aktif: 'Y',
  keyword: ''
};

export default function MiningProductionPlanPage() {
  const [params, setParams] = useState(defaultParams);
  const [openFilter, setOpenFilter] = useState(false);
  const { data, page, perPage, total, lastPage, dataLoading, dataError, mutate } = useGetMiningProductionPlan(params);

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

  const handleToggleActive = async (row) => {
    try {
      if (String(row.aktif || 'Y') === 'Y') {
        const ok = window.confirm(`Nonaktifkan plan ${row.periode} - ${row.nmcontractor || row.contractor_id}?`);
        if (!ok) return;
        await deleteMiningProductionPlan(row.id);
        notifySuccess('Mining plan berhasil dinonaktifkan.');
      } else {
        await reactivateMiningProductionPlan(row.id);
        notifySuccess('Mining plan berhasil diaktifkan kembali.');
      }
      await mutate();
    } catch (error) {
      const message = error?.diagnostic?.message || error?.message || 'Gagal memproses perubahan status mining plan.';
      notifyError(message);
    }
  };

  return (
    <>
      <Breadcrumbs custom heading="Mining Production Plan" links={breadcrumbLinks} />

      <MainCard
        title={
          <Button variant="contained" component={Link} href="/mining-production-plan/create" startIcon={<Add />}>
            Tambah Plan
          </Button>
        }
        secondary={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="secondary" startIcon={<Filter />} onClick={() => setOpenFilter(true)}>
              Filter
            </Button>
          </Stack>
        }
        content
      >
        {dataError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Gagal mengambil data mining production plan. Cek koneksi atau sesi login.
          </Alert>
        )}

        {dataLoading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <MiningProductionPlanList rows={data} onToggleActive={handleToggleActive} />
            <Stack sx={{ mt: 2 }}>
              <Paginate
                page={page || params.page}
                total={total || 0}
                lastPage={lastPage || 1}
                perPage={perPage || params.per_page}
                onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
              />
            </Stack>
          </>
        )}
      </MainCard>

      <MiningProductionPlanFilter open={openFilter} onClose={() => setOpenFilter(false)} params={params} setParams={setParams} />
    </>
  );
}
