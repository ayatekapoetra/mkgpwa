'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import axiosServices from 'utils/axios';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

import MainCard from 'components/MainCard';

import moment from 'moment';
import { Printer, Eye, Filter } from 'iconsax-react';
import ListShippingOrder from './list';
import { useGetShippingOrder } from 'api/shipping-order';
import FilterShippingOrder from './filter';
import Paginate from 'components/Paginate';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Shipping Order', to: '/shipping-order' }
];

export default function ShippingOrderScreen() {
  const columns = DataColumn();
  const [filtered, setFiltered] = useState({
    page: 1,
    perPage: 25,
    kode: '',
    narasi: '',
    startDate: '',
    endDate: '',
    gudang_id: ''
  });
  const { data, dataLoading, dataError } = useGetShippingOrder(filtered);
  const [openFilter, setOpenFilter] = useState(false);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Shipping Order'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/shipping-order/create">
            Buat Shipping
          </Button>
        }
        secondary={
          <IconButton shape="rounded" color="secondary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        }
        content={false}
      >
        <FilterShippingOrder count={data?.total} data={filtered} setData={setFiltered} open={openFilter} onClose={toggleFilterHandle} />
        {dataError ? (
          <Alert severity="warning" sx={{ m: 2 }}>Gagal memuat shipping order. Periksa koneksi dan coba kembali.</Alert>
        ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : (
          <Stack>
            <ListShippingOrder
              columns={columns}
              data={data?.data || []}
              paginate={
                <Paginate
                  page={data?.page || filtered.page}
                  total={data?.total || 0}
                  lastPage={data?.lastPage || 1}
                  perPage={data?.perPage || filtered.perPage}
                  onPageChange={(page) => setFiltered((prev) => ({ ...prev, page }))}
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
  const handlePrint = async (id) => {
    try {
      const response = await axiosServices.get(`/scm/shipping-order/${id}/print`, {
        responseType: 'blob',
        skipOfflineQueue: true
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.diagnostic?.error || error?.message || 'Dokumen shipping gagal dicetak...',
        alert: { color: 'error' }
      });
    }
  };

  const column = useMemo(
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
            <Stack direction="row" spacing={0.5}>
              <IconButton component={Link} href={`/shipping-order/${id}/show`} variant="dashed" color="primary">
                <Eye />
              </IconButton>
              <IconButton variant="dashed" color="secondary" onClick={() => handlePrint(id)}>
                <Printer />
              </IconButton>
            </Stack>
          );
        }
      },
      {
        Header: 'Kode',
        id: 'kode',
        accessor: 'kode',
        minWidth: 100,
        Cell: ({ row }) => {
          const { kode, ddmmyy } = row.original;
          return (
            <div>
              <Typography variant="body1">{kode}</Typography>
              <Typography variant="caption" color="secondary">
                {ddmmyy}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'pengirim',
        Header: 'Pengirim',
        accessor: 'nm_pengirim',
        minWidth: 200,
        Cell: ({ row }) => {
          const { nm_pengirim, alamat_pengirim } = row.original;
          return (
            <div>
              <Typography variant="body1">{nm_pengirim}</Typography>
              <Typography variant="caption" color="secondary">
                {alamat_pengirim}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'penerima',
        Header: 'Penerima',
        accessor: 'nm_penerima',
        minWidth: 200,
        Cell: ({ row }) => {
          const { nm_penerima, alamat_penerima } = row.original;
          return (
            <div>
              <Typography variant="body1">{nm_penerima}</Typography>
              <Typography variant="caption" color="secondary">
                {alamat_penerima}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'keterangan',
        Header: 'Keterangan',
        accessor: 'narasi',
        minWidth: 200,
        Cell: ({ row }) => {
          const { narasi, status } = row.original;
          return (
            <Stack spacing={0.5}>
              <Typography variant="body2">{narasi || '-'}</Typography>
              <Chip
                size="small"
                label={status === 'received' ? 'diterima' : 'pending'}
                color={status === 'received' ? 'success' : 'warning'}
                variant="filled"
                sx={{ width: 'fit-content', textTransform: 'capitalize' }}
              />
            </Stack>
          );
        }
      }
    ],
    []
  );

  return column;
}
