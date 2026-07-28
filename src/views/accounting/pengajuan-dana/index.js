'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Alert, Box, Button, CircularProgress, Grid, Stack, TextField, Typography } from '@mui/material';
import { Add, DocumentDownload, Filter } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import Paginate from 'components/Paginate';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { exportPengajuanDanaExcel, useGetPengajuanDana, usePengajuanDanaApprovalCount } from 'api/pengajuan-dana';

import PengajuanDanaList from './list';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Pengajuan Dana', to: '/pengajuan-dana' }
];

const defaultParams = {
  page: 1,
  limit: 25,
  status: '',
  kategori: '',
  kode: '',
  narasi: '',
  date_start: '',
  date_end: ''
};

function SummaryCard({ title, value, helper }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 2.5, height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {helper}
      </Typography>
    </Box>
  );
}

export default function PengajuanDanaPage() {
  const [params, setParams] = useState(defaultParams);
  const [exporting, setExporting] = useState(false);
  const { rows, page, perPage, total, lastPage, summary, loading, error } = useGetPengajuanDana(params);
  const approvalCount = usePengajuanDanaApprovalCount();

  const summaryCards = useMemo(
    () => [
      { title: 'Total Data', value: summary?.total_all || 0, helper: 'Sesuai filter aktif' },
      { title: 'Open', value: summary?.open || 0, helper: 'Siap edit / approval' },
      { title: 'Approval', value: summary?.approval || 0, helper: 'Menunggu verifikasi finance' },
      { title: 'Waiting Action', value: approvalCount.count || 0, helper: 'Open + approval' }
    ],
    [summary, approvalCount.count]
  );

  const handleSearch = (field, value) => {
    setParams((prev) => ({ ...prev, page: 1, [field]: value }));
  };

  const handleExport = async () => {
    if (exporting) return;

    setExporting(true);
    try {
      const { blob, filename } = await exportPengajuanDanaExcel(params);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (exportError) {
      openNotification({
        open: true,
        title: 'error',
        message: exportError?.message || 'Gagal export pengajuan non part',
        alert: { color: 'error' }
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Breadcrumbs custom heading="Pengajuan Dana" links={breadcrumbLinks} />

      <MainCard
        title={
          <Button variant="contained" component={Link} href="/pengajuan-dana/create" startIcon={<Add />}>
            Tambah Pengajuan
          </Button>
        }
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" color="secondary" startIcon={<DocumentDownload />} onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
            <Stack direction="row" spacing={1} alignItems="center">
              <Filter size={18} />
              <Typography variant="body2" color="text.secondary">
                Filter cepat
              </Typography>
            </Stack>
          </Stack>
        }
        content
      >
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {summaryCards.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.title}>
                <SummaryCard {...item} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Kode" value={params.kode} onChange={(event) => handleSearch('kode', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Narasi" value={params.narasi} onChange={(event) => handleSearch('narasi', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Status"
                value={params.status}
                onChange={(event) => handleSearch('status', event.target.value)}
              >
                <option value="">Semua</option>
                <option value="open">Open</option>
                <option value="approval">Approval</option>
                <option value="close">Close</option>
                <option value="reject">Reject</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Tanggal Mulai" type="date" InputLabelProps={{ shrink: true }} value={params.date_start} onChange={(event) => handleSearch('date_start', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Tanggal Akhir" type="date" InputLabelProps={{ shrink: true }} value={params.date_end} onChange={(event) => handleSearch('date_end', event.target.value)} />
            </Grid>
          </Grid>

          {error && (
            <Alert severity="warning">
              Gagal mengambil data pengajuan non part. {error?.message || 'Cek koneksi atau sesi login.'}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <PengajuanDanaList rows={rows} />
              <Stack sx={{ mt: 2 }}>
                <Paginate
                  page={page || params.page}
                  total={total || 0}
                  lastPage={lastPage || 1}
                  perPage={perPage || params.limit}
                  onPageChange={(newPage) => setParams((prev) => ({ ...prev, page: newPage }))}
                />
              </Stack>
            </>
          )}
        </Stack>
      </MainCard>
    </>
  );
}
