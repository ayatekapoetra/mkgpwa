'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Eye, SearchNormal1 } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

import { useGetGoodsReceipt } from 'api/goods-receipt';
import { useGetGudang } from 'api/gudang';
import ListGoodsReceipt from './list';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Terima Barang', to: '/goods-receipt' }
];

export default function GoodsReceiptScreen() {
  const columns = DataColumn();
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 25,
    kodeReceipt: '',
    kodeSj: '',
    narasi: '',
    startDate: '',
    endDate: '',
    gudangId: ''
  });
  const { data, dataLoading, dataError } = useGetGoodsReceipt(filters);
  const { data: gudangRows } = useGetGudang();

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Terima Barang'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/goods-receipt/create">
            Buat Penerimaan
          </Button>
        }
        content={false}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Kode Receipt"
                size="small"
                fullWidth
                value={filters.kodeReceipt}
                onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, kodeReceipt: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Kode Surat Jalan"
                size="small"
                fullWidth
                value={filters.kodeSj}
                onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, kodeSj: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Gudang"
                size="small"
                fullWidth
                value={filters.gudangId}
                onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, gudangId: event.target.value }))}
              >
                <MenuItem value="">Semua Gudang</MenuItem>
                {gudangRows.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{`${item.kode || '-'} - ${item.nama || '-'}`}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Narasi"
                size="small"
                fullWidth
                value={filters.narasi}
                onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, narasi: event.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchNormal1 size={16} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, startDate: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="End Date"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, endDate: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Per Page"
                size="small"
                fullWidth
                value={filters.perPage}
                onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, perPage: Number(event.target.value) }))}
              >
                {[10, 25, 50, 100].map((value) => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>
        {dataError ? (
          <Alert severity="warning" sx={{ m: 2 }}>Gagal memuat data terima barang.</Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : (
          <Stack>
            <ListGoodsReceipt
              columns={columns}
              data={data?.data || []}
              paginate={
                <Paginate
                  page={data?.page || filters.page}
                  total={data?.total || 0}
                  lastPage={data?.lastPage || 1}
                  perPage={data?.perPage || filters.perPage}
                  onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
                />
              }
            />
          </Stack>
        )}
      </MainCard>
    </Fragment>
  );
}

function DataColumn() {
  return useMemo(
    () => [
      {
        Header: () => <div style={{ textAlign: 'center', maxWidth: 5 }}>ACT</div>,
        accessor: 'index',
        width: 60,
        disableSortBy: true,
        disableFilters: true,
        Cell: ({ row }) => {
          const { id } = row.original;
          return (
            <Box sx={{ width: 30, textAlign: 'center' }}>
              <IconButton component={Link} href={`/goods-receipt/${id}/show`} variant="dashed" color="primary">
                <Eye />
              </IconButton>
            </Box>
          );
        }
      },
      {
        Header: 'Kode Receipt',
        accessor: 'reff_rcp',
        minWidth: 140,
        Cell: ({ row }) => (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={700}>{row.original.reff_rcp}</Typography>
            <Typography variant="caption" color="text.secondary">{row.original.receivedDateLabel}</Typography>
          </Stack>
        )
      },
      {
        Header: 'Surat Jalan',
        accessor: 'kode_sj',
        minWidth: 140,
        Cell: ({ row }) => <Typography variant="body2">{row.original.kode_sj || '-'}</Typography>
      },
      {
        Header: 'Gudang',
        accessor: 'gudang.nama',
        minWidth: 220,
        Cell: ({ row }) => (
          <Typography variant="body2">{row.original.gudang?.nama || row.original.gudang_id || '-'}</Typography>
        )
      },
      {
        Header: 'Narasi',
        accessor: 'narasi',
        minWidth: 280,
        Cell: ({ row }) => <Typography variant="body2">{row.original.narasi || '-'}</Typography>
      },
      {
        Header: 'Items',
        accessor: 'itemCount',
        minWidth: 100,
        Cell: ({ row }) => <Typography variant="body2">{row.original.itemCount || 0}</Typography>
      }
    ],
    []
  );
}
