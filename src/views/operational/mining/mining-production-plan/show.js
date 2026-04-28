'use client';

import { Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper
} from '@mui/material';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  fetchRitaseMiningProductionPlan,
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
  const items = Array.isArray(row?.items) ? row.items : [];

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

  const handleFetchRitase = async () => {
    try {
      const result = await fetchRitaseMiningProductionPlan(id);
      await mutate();
      const updated = result?.rows?.updated_rows ?? 0;
      const totalActual = Number(result?.rows?.total_actual || 0).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      notifySuccess(`Data ritase berhasil diambil. ${updated} baris diperbarui, total actual ${totalActual} MT.`);
    } catch (error) {
      const message = error?.diagnostic?.message || error?.message || 'Gagal ambil data ritase.';
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
        submitLabel="Update"
      />

      <MainCard
        title="Detail Plan Harian"
        secondary={
          <Button variant="outlined" size="small" onClick={handleFetchRitase}>
            Ambil Data Ritase
          </Button>
        }
        sx={{ mt: 2 }}
      >
        {items.length === 0 ? (
          <Alert severity="info">Belum ada detail item harian untuk plan ini.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tanggal Ops</TableCell>
                  <TableCell align="right">Detail Plan (MT)</TableCell>
                  <TableCell align="right">Actual (MT)</TableCell>
                  <TableCell>Narasi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items
                  .slice()
                  .sort((a, b) => String(a.date_ops || '').localeCompare(String(b.date_ops || '')))
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        {item.date_ops
                          ? new Date(item.date_ops).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell align="right">{Number(item.detailplan || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">{Number(item.actual || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">{item.narasi || '-'}</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>
    </Fragment>
  );
}
