'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Stack, Button, Alert, CircularProgress, Box } from '@mui/material';
import { Add, Filter, Refresh } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useCheckerPitGroups } from 'api/checker-pit';

import CheckerPitFilter from './filter';
import CheckerPitList from './list';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Daily Checker PIT', to: '/daily-checker-pit' }
];

const defaultParams = {
  date_ops: '',
  shift_id: '',
  sync_status: '',
  excavator_keyword: '',
  pit_keyword: '',
  material_keyword: ''
};

export default function DailyCheckerPitPage() {
  const router = useRouter();
  const [params, setParams] = useState(defaultParams);
  const [openFilter, setOpenFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { grouped, dataLoading, dataError, mutate } = useCheckerPitGroups({
    date_ops: params.date_ops,
    shift_id: params.shift_id,
    limit: 0
  });
  

  const rows = useMemo(() => {
    return grouped.filter((item) => {
      const matchDate = !params.date_ops || item.date_ops === params.date_ops;
      const matchShift = !params.shift_id || item.shift_id === params.shift_id;
      const matchSync =
        !params.sync_status ||
        (params.sync_status === 'PENDING' ? item.pending > 0 : item.pending === 0);
      const excavator = (item.excavator_kode || '').toLowerCase();
      const pit = (item.pit_nama || '').toLowerCase();
      const material = (item.material_nama || '').toLowerCase();

      const matchExcavator = !params.excavator_keyword || excavator.includes(params.excavator_keyword.toLowerCase());
      const matchPit = !params.pit_keyword || pit.includes(params.pit_keyword.toLowerCase());
      const matchMaterial = !params.material_keyword || material.includes(params.material_keyword.toLowerCase());

      return matchDate && matchShift && matchSync && matchExcavator && matchPit && matchMaterial;
    });
  }, [grouped, params]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [params]);

  const handleRefresh = async () => {
    await mutate();
    openNotification({ message: 'Data Checker PIT di-refresh', type: 'success' });
  };

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenCreate = () => {
    router.push('/daily-checker-pit/create');
  };

  const handleOpenDetail = (row) => {
    const query = new URLSearchParams({
      date_ops: row.date_ops || '',
      shift_id: String(row.shift_id || ''),
      excavator_id: String(row.excavator_id || ''),
      startpit_id: String(row.startpit_id || ''),
      material_id: String(row.material_id || '')
    });
    router.push(`/daily-checker-pit/detail?${query.toString()}`);
  };

  const handleOpenHitungRit = (row) => {
    const query = new URLSearchParams({
      date_ops: row.date_ops || '',
      shift_id: String(row.shift_id || ''),
      excavator_id: String(row.excavator_id || ''),
      startpit_id: String(row.startpit_id || ''),
      material_id: String(row.material_id || '')
    });
    router.push(`/daily-checker-pit/hitung-rit?${query.toString()}`);
  };

  return (
    <>
      <Breadcrumbs custom heading="Daily Checker PIT" links={breadcrumbLinks} />

      <MainCard
        title={
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
            Ritase PIT
          </Button>
        }
        secondary={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="secondary" startIcon={<Filter />} onClick={() => setOpenFilter(true)}>
              Filter
            </Button>
            <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
              Refresh
            </Button>
          </Stack>
        }
        content
      >
        {dataError && <Alert severity="warning" sx={{ mb: 2 }}>Gagal mengambil data dari server. Cek koneksi atau sesi login.</Alert>}
        {dataLoading && (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {!dataLoading && (
          <CheckerPitList
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

      <CheckerPitFilter open={openFilter} onClose={() => setOpenFilter(false)} params={params} setParams={setParams} />
    </>
  );
}
