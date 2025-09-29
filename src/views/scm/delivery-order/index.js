'use client';

// REACT
import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

// MATERIAL - UI
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

// COMPONENTS
import MainCard from 'components/MainCard';

// THIRD - PARTY
import moment from 'moment';
import { Filter, Trash } from 'iconsax-react';
import ListDeliveryOrder from './list';
import { useGetDeliveryOrder } from 'api/delivery-order';
import LinearWithLabel from 'components/@extended/progress/LinearWithLabel';
import Paginate from 'components/Paginate';
import FilterDeliveryOrder from './filter';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Delivery Order', to: '/delivery-order' }
];

export default function DeliveryOrderScreen() {
  const columns = DataColumn();
  const [filtered, setFiltered] = useState({
    page: 1,
    perPage: 25,
    kode: ''
  });
  const { data, dataLoading } = useGetDeliveryOrder(filtered);
  const [state, setState] = useState([]);
  const [openFilter, setOpenFilter] = useState(false);

  useEffect(() => {
    if (data) setState(data.data);
  }, [data]);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Delivery Order'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/delivery-order/create">
            Buat Del.Order
          </Button>
        }
        secondary={
          <IconButton shape="rounded" color="secondary" onClick={toggleFilterHandle}>
            <Filter />
          </IconButton>
        }
        content={false}
      >
        <FilterDeliveryOrder count={data?.total} data={filtered} setData={setFiltered} open={openFilter} onClose={toggleFilterHandle} />
        {dataLoading ? (
          <div>loading...</div>
        ) : (
          <Stack>
            <ListDeliveryOrder
              columns={columns}
              data={state}
              paginate={
                <Paginate
                  page={data.page}
                  total={data.total}
                  lastPage={data.lastPage}
                  perPage={data.perPage}
                  onPageChange={(newPage) => setFiltered({ ...filtered, page: newPage })}
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
            <Box sx={{ width: 15, textAlign: 'center' }}>
              <IconButton component={Link} href={`/delivery-order/${id}/show`} variant="dashed" color="error">
                <Trash />
              </IconButton>
            </Box>
          );
        }
      },
      {
        Header: 'Kode',
        id: 'kode',
        accessor: 'kode',
        minWidth: 100, // lebar minimum
        Cell: ({ row }) => {
          const { kode, do_date } = row.original;
          return (
            <div>
              <Typography variant="body1">{kode}</Typography>
              <Typography variant="caption" color="secondary">
                {moment(do_date).format('DD-MM-YYYY')}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'pemasok_id',
        Header: 'Pemasok',
        accessor: 'pemasok.nama',
        minWidth: 450, // lebar minimum
        Cell: ({ row }) => {
          const { pemasok, narasi } = row.original;
          return (
            <div>
              <Typography variant="body1">{pemasok.nama}</Typography>
              <Typography variant="caption" color="secondary">
                {narasi}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'via',
        Header: 'Via',
        accessor: 'via'
      },
      {
        Header: () => <div>Jenis & Type</div>,
        id: 'jenis',
        accessor: 'jenis',
        Cell: ({ row }) => {
          const { jenis, type } = row.original;
          return (
            <div>
              <Typography variant="body1">{jenis}</Typography>
              <Typography variant="caption" color="secondary">
                {type}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'forwarder',
        Header: 'FWD',
        accessor: 'forwarder'
      },
      {
        id: 'delivered_at',
        Header: 'Delivered At',
        accessor: 'delivered_at',
        Cell: ({ row }) => {
          const { delivered_at } = row.original;
          return (
            <Stack>
              <Typography variant="body1" color="secondary">
                {moment(delivered_at).format('DD-MM-YYYY')}
              </Typography>
            </Stack>
          );
        }
      },
      {
        id: 'estreceived',
        Header: 'Estimate',
        accessor: 'est_received',
        Cell: ({ row }) => {
          const { est_received } = row.original;
          return (
            <Stack>
              <Typography variant="body1" color="secondary">
                {moment(est_received).format('DD-MM-YYYY')}
              </Typography>
            </Stack>
          );
        }
      },
      {
        Header: 'Progress',
        accessor: 'progress',
        Cell: ({ value }) => {
          return <LinearWithLabel value={value} sx={{ minWidth: 75 }} />;
        }
      }
    ],
    []
  );

  return column;
}
