'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Stack, Button, Chip, Alert, CircularProgress, Box } from '@mui/material';
import { Add, DocumentDownload, Filter, Warning2 } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useCheckerStockpileGroups, useCheckerStockpileUnmatchedCount } from 'api/checker-stockpile';
import axiosServices from 'utils/axios';

import CheckerStockpileFilter from './filter';
import CheckerStockpileList from './list';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Daily Checker Stockpile', to: '/daily-checker-stockpile' }
];

const defaultParams = {
  date_ops: '',
  shift_id: '',
  sync_status: '',
  stockpile_keyword: '',
  material_keyword: '',
  dom_keyword: ''
};

export default function DailyCheckerStockpilePage() {
  const router = useRouter();
  const [params, setParams] = useState(defaultParams);
  const [openFilter, setOpenFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { grouped, dataLoading, dataError } = useCheckerStockpileGroups({
    date_ops: params.date_ops,
    shift_id: params.shift_id,
    limit: 0
  });
  const { total: unmatchedCount = 0 } = useCheckerStockpileUnmatchedCount();

  const rows = useMemo(() => {
    return grouped.filter((item) => {
      const matchDate = !params.date_ops || item.date_ops === params.date_ops;
      const matchShift = !params.shift_id || item.shift_id === params.shift_id;
      const matchSync =
        !params.sync_status ||
        (params.sync_status === 'PENDING' ? item.pending > 0 : item.pending === 0);
      const stockpile = (item.stockpile_nama || '').toLowerCase();
      const material = (item.material_nama || '').toLowerCase();
      // const materialtipe = (item.kondisi_material || '').toLowerCase();
      const dom = (item.dom_code || '').toLowerCase();

      const matchStockpile = !params.stockpile_keyword || stockpile.includes(params.stockpile_keyword.toLowerCase());
      const matchMaterial = !params.material_keyword || material.includes(params.material_keyword.toLowerCase());
      const matchDom = !params.dom_keyword || dom.includes(params.dom_keyword.toLowerCase());

      return matchDate && matchShift && matchSync && matchStockpile && matchMaterial && matchDom;
    });
  }, [grouped, params]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [params]);

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownloadPdf = async () => {
    const date = params.date_ops || '';

    if (!date) {
      openNotification({
        type: 'warning',
        message: 'Pilih tanggal operasional terlebih dahulu untuk download PDF.'
      });
      return;
    }

    try {
      setDownloadingPdf(true);

      const response = await axiosServices.get('/api/ritase/sample-download-pdf', {
        params: {
          startDate: date,
          endDate: date
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sample-stockpile-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      openNotification({
        type: 'success',
        message: 'PDF sample stockpile berhasil di-download.'
      });
    } catch (error) {
      openNotification({
        type: 'error',
        message: error?.message || 'Gagal download PDF sample stockpile.'
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenCreate = () => {
    router.push('/daily-checker-stockpile/create');
  };

  const handleOpenUnmatched = () => {
    router.push('/daily-checker-stockpile/unmatched');
  };

  const handleOpenDetail = (row) => {
    const query = new URLSearchParams({
      date_ops: row.date_ops || '',
      shift_id: String(row.shift_id || ''),
      material_id: String(row.material_id || ''),
      stockpile_id: String(row.stockpile_id || ''),
      dom_id: String(row.dom_id || '')
    });
    router.push(`/daily-checker-stockpile/detail?${query.toString()}`);
  };

  const handleOpenHitungRit = (row) => {
    const query = new URLSearchParams({
      date_ops: row.date_ops || '',
      shift_id: String(row.shift_id || ''),
      material_id: String(row.material_id || ''),
      stockpile_id: String(row.stockpile_id || ''),
      dom_id: String(row.dom_id || '')
    });
    router.push(`/daily-checker-stockpile/hitung-rit?${query.toString()}`);
  };
  console.log('pagedRows----', pagedRows);
  
  return (
    <>
      <Breadcrumbs custom heading="Daily Checker Stockpile" links={breadcrumbLinks} />

      <MainCard
        title={
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
            Ritase Stockpile
          </Button>
        }
        secondary={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="warning" startIcon={<Warning2 />} onClick={handleOpenUnmatched}>
              Unmatched
              <Chip label={unmatchedCount} size="small" color="warning" sx={{ ml: 1 }} />
            </Button>
            <Button variant="outlined" color="secondary" startIcon={<Filter />} onClick={() => setOpenFilter(true)}>
              Filter
            </Button>
            <Button variant="outlined" startIcon={<DocumentDownload />} onClick={handleDownloadPdf} disabled={downloadingPdf}>
              Download
            </Button>
          </Stack>
        }
        content
      >
        {dataError && <Alert severity="warning" sx={{ mb: 2 }}>Gagal mengambil data stockpile dari server. Cek koneksi atau sesi login.</Alert>}
        {dataLoading && (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {!dataLoading && (
          <CheckerStockpileList
            rows={pagedRows}
            totalCount={rows.length}
            onOpenDetail={handleOpenDetail}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </MainCard>

      <CheckerStockpileFilter open={openFilter} onClose={() => setOpenFilter(false)} params={params} setParams={setParams} />
    </>
  );
}
