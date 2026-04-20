'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { ArrowLeft, Refresh } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { useCheckerPitDetailScope } from 'api/checker-pit';

const shiftLabel = (shiftId) => {
  if (String(shiftId) === '1') return 'Shift 1';
  if (String(shiftId) === '2') return 'Shift 2';
  if (String(shiftId) === '3') return 'Shift 3';
  return '-';
};

const syncColor = (status) => {
  const value = String(status || '').toUpperCase();
  if (value === 'SYNCED') return 'success';
  if (value === 'CONFLICT') return 'error';
  return 'warning';
};

export default function DailyCheckerPitDetailView() {
  const searchParams = useSearchParams();
  const date_ops = searchParams?.get('date_ops') || '';
  const shift_id = searchParams?.get('shift_id') || '';
  const excavator_id = searchParams?.get('excavator_id') || '';
  const startpit_id = searchParams?.get('startpit_id') || '';
  const material_id = searchParams?.get('material_id') || '';

  const { rows, stats, dataLoading, dataError, mutate } = useCheckerPitDetailScope({
    date_ops,
    shift_id,
    excavator_id,
    startpit_id,
    material_id
  });

  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Daily Checker PIT', to: '/daily-checker-pit' },
    { title: 'Detail' }
  ];

  const scopeMeta = rows?.[0] || {};

  return (
    <>
      <Breadcrumbs custom heading="Detail Checker PIT" links={breadcrumbLinks} />

      <MainCard
        title={
          <Button component={Link} href="/daily-checker-pit" variant="outlined" startIcon={<ArrowLeft />}>
            Kembali
          </Button>
        }
        secondary={
          <Button variant="outlined" startIcon={<Refresh />} onClick={mutate}>
            Refresh
          </Button>
        }
      >
        {dataError && <Alert severity="warning">Gagal memuat data detail PIT. Cek koneksi atau login ulang.</Alert>}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Ritase</Typography>
              <Typography variant="h4">{stats?.total || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Synced</Typography>
              <Typography variant="h4" color="success.main">{stats?.synced || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Pending</Typography>
              <Typography variant="h4" color="warning.main">{stats?.pending || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Conflict</Typography>
              <Typography variant="h4" color="error.main">{stats?.conflict || 0}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Scope Group</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Typography variant="body2">Tanggal: <strong>{date_ops || '-'}</strong></Typography>
            <Typography variant="body2">Shift: <strong>{shiftLabel(shift_id)}</strong></Typography>
            <Typography variant="body2">Excavator: <strong>{scopeMeta.excavator_kode || `ID ${excavator_id || '-'}`}</strong></Typography>
            <Typography variant="body2">PIT: <strong>{scopeMeta.pit_nama || `ID ${startpit_id || '-'}`}</strong></Typography>
            <Typography variant="body2">Material: <strong>{scopeMeta.material_nama || `ID ${material_id || '-'}`}</strong></Typography>
          </Stack>
        </Paper>

        {dataLoading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Jam</TableCell>
                  <TableCell>Dumptruck</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>PIT</TableCell>
                  <TableCell>Tujuan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sync</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="text.secondary">Tidak ada data ritase pada scope ini.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((item) => (
                  <TableRow key={item.ritase_pit_id || `${item.starttime}-${item.dumptruck_id}`} hover>
                    <TableCell>{item.starttime ? new Date(item.starttime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{item.dumptruck_kode || '-'}</TableCell>
                    <TableCell>{item.driver_nama || '-'}</TableCell>
                    <TableCell>{item.material_nama || '-'}</TableCell>
                    <TableCell>{item.pit_nama || '-'}</TableCell>
                    <TableCell>{item.stockpile_nama || '-'}</TableCell>
                    <TableCell>{item.status || '-'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={item.sync_status || 'PENDING'} color={syncColor(item.sync_status)} variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>
    </>
  );
}
