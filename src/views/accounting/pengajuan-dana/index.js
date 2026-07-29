'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { Add, DocumentDownload, Filter as FilterIcon } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import Paginate from 'components/Paginate';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  exportPengajuanDanaExcel,
  useGetPengajuanDana,
  usePengajuanDanaAccess,
  usePengajuanDanaApprovalCount
} from 'api/pengajuan-dana';

import PengajuanDanaList from './list';
import PengajuanDanaFilter from './filter';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Pengajuan Dana', to: '/pengajuan-dana' }
];

const defaultParams = {
  page: 1,
  limit: 25,
  status: '',
  kategori: '',
  bisnis_id: '',
  cabang_id: '',
  author_id: '',
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { permissions, loading: accessLoading, error: accessError } = usePengajuanDanaAccess();
  const canRead = !accessLoading && !accessError && permissions.can_read;
  const { rows, page, perPage, total, lastPage, summary, loading, error } = useGetPengajuanDana(params, canRead);
  const approvalCount = usePengajuanDanaApprovalCount(canRead);

  const summaryCards = useMemo(
    () => [
      { title: 'Total Data', value: summary?.total_all || 0, helper: 'Sesuai filter aktif' },
      { title: 'Open', value: summary?.open || 0, helper: 'Siap edit / approval' },
      { title: 'Approval', value: summary?.approval || 0, helper: 'Menunggu verifikasi finance' },
      { title: 'Waiting Action', value: approvalCount.count || 0, helper: 'Open + approval' }
    ],
    [summary, approvalCount.count]
  );

  const activeFilterCount = useMemo(
    () => {
      const fieldCount = ['status', 'kategori', 'bisnis_id', 'cabang_id', 'author_id', 'kode', 'narasi', 'date_start', 'date_end']
        .filter((field) => Boolean(params[field])).length;
      return fieldCount + (Number(params.limit) !== 25 ? 1 : 0);
    },
    [params]
  );

  const applyFilters = (filters) => {
    setParams((current) => ({ ...current, ...filters, page: 1 }));
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setParams(defaultParams);
    setFilterOpen(false);
  };

  const handleExport = async () => {
    if (exporting || !permissions.can_read) return;

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
          permissions.can_insert ? (
            <Button variant="contained" component={Link} href="/pengajuan-dana/create" startIcon={<Add />}>
              Tambah Pengajuan
            </Button>
          ) : null
        }
        secondary={
          canRead ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button variant="outlined" color="secondary" startIcon={<DocumentDownload />} onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              <Button variant={activeFilterCount ? 'contained' : 'outlined'} color="primary" startIcon={<FilterIcon size={18} />} onClick={() => setFilterOpen(true)}>
                Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
              </Button>
            </Stack>
          ) : null
        }
        content
      >
        <Stack spacing={3}>
          {accessLoading && (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {accessError && <Alert severity="error">Gagal memeriksa hak akses Pengajuan Dana. {accessError?.message || 'Coba muat ulang halaman.'}</Alert>}

          {!accessLoading && !accessError && !permissions.can_read && (
            <Alert severity="warning">Anda tidak memiliki hak akses untuk melihat Pengajuan Dana.</Alert>
          )}

          {canRead && (
            <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))'
              },
              gap: 2,
              width: '100%'
            }}
          >
            {summaryCards.map((item) => (
              <Box key={item.title} sx={{ minWidth: 0 }}>
                <SummaryCard {...item} />
              </Box>
            ))}
          </Box>

          {activeFilterCount > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">Filter aktif:</Typography>
              {params.kode && <Chip size="small" label={`Kode: ${params.kode}`} />}
              {params.narasi && <Chip size="small" label={`Narasi: ${params.narasi}`} />}
              {params.status && <Chip size="small" label={`Status: ${params.status}`} />}
              {params.kategori && <Chip size="small" label={`Kategori: ${params.kategori}`} />}
              {params.bisnis_id && <Chip size="small" label={`Bisnis ID: ${params.bisnis_id}`} />}
              {params.cabang_id && <Chip size="small" label={`Cabang ID: ${params.cabang_id}`} />}
              {params.author_id && <Chip size="small" label={`Author ID: ${params.author_id}`} />}
              {params.date_start && <Chip size="small" label={`Mulai: ${params.date_start}`} />}
              {params.date_end && <Chip size="small" label={`Akhir: ${params.date_end}`} />}
              {Number(params.limit) !== 25 && <Chip size="small" label={`${params.limit} baris/halaman`} />}
              <Button size="small" color="error" onClick={resetFilters}>Reset</Button>
            </Stack>
          )}

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
            </>
          )}
        </Stack>
      </MainCard>

      {canRead && (
        <PengajuanDanaFilter
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          params={params}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      )}
    </>
  );
}
