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
import { Eye, Filter } from 'iconsax-react';
import ListPickupOrder from './list';
import { useGetPickupOrder } from 'api/pickup-order';
import FilterPickupOrder from './filter';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Pickup Order', to: '/pickup-order' }
];

export default function PickupOrderScreen() {
  const columns = DataColumn();
  const { data, dataLoading } = useGetPickupOrder();
  const [state, setState] = useState([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [filtered, setFiltered] = useState({
    kode: '',
    pickup_by: '',
    keterangan: ''
  });

  useEffect(() => {
    const rows = Array.isArray(data) ? data : [];
    const keywordKode = filtered.kode.trim().toLowerCase();
    const keywordPickupBy = filtered.pickup_by.trim().toLowerCase();
    const keywordKeterangan = filtered.keterangan.trim().toLowerCase();

    const nextState = rows.filter((item) => {
      const matchKode = !keywordKode || String(item.kode || '').toLowerCase().includes(keywordKode);
      const matchPickupBy = !keywordPickupBy || String(item.pickup_by || '').toLowerCase().includes(keywordPickupBy);
      const matchKeterangan = !keywordKeterangan || String(item.keterangan || '').toLowerCase().includes(keywordKeterangan);

      return matchKode && matchPickupBy && matchKeterangan;
    });

    setState(nextState);
  }, [data, filtered]);

  const toggleFilterHandle = () => {
    setOpenFilter(!openFilter);
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Pickup Order'} links={breadcrumbLinks} />
      <MainCard
        title={
          <Button variant="contained" component={Link} href="/pickup-order/create">
            Buat Pickup
          </Button>
        }
        secondary={
          <IconButton color="secondary" onClick={toggleFilterHandle} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } }}>
            <Filter />
          </IconButton>
        }
        content={false}
      >
        <FilterPickupOrder count={state.length} data={filtered} setData={setFiltered} open={openFilter} onClose={toggleFilterHandle} />
        {dataLoading || !data ? (
          <div>loading...</div>
        ) : (
          <Stack>
            <ListPickupOrder
              columns={columns}
              data={state}
              paginate={null}
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
              <IconButton component={Link} href={`/pickup-order/${id}/show`} variant="dashed" color="primary">
                <Eye />
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
          const { kode, date_pickup } = row.original;
          return (
            <div>
              <Typography variant="body1">{kode}</Typography>
              <Typography variant="caption" color="secondary">
                {moment(date_pickup).format('DD-MM-YYYY')}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'pickup_by',
        Header: 'Pickup',
        accessor: 'pickup_by',
        minWidth: 450, // lebar minimum
        Cell: ({ row }) => {
          const { pickup_by, keterangan } = row.original;
          return (
            <div>
              <Typography variant="body1">{pickup_by}</Typography>
              <Typography variant="caption" color="secondary">
                {keterangan}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'gudang',
        Header: 'Gudang Transit',
        accessor: 'gudang.nama',
        Cell: ({ row }) => {
          const { gudang } = row.original;
          return <Typography>{gudang?.nama || '-'}</Typography>;
        }
      },
      {
        Header: () => <div>Accepted</div>,
        id: 'accepted_by',
        accessor: 'acceptedby.nama_lengkap',
        Cell: ({ row }) => {
          const { acceptedby, prioritas } = row.original;
          return (
            <div>
              <Typography variant="body1">{acceptedby?.nama_lengkap || '-'}</Typography>
              <Typography variant="caption" color="secondary">
                Prioritas {prioritas}
              </Typography>
            </div>
          );
        }
      },
      {
        id: 'totitems',
        Header: 'Items',
        accessor: 'totitems'
      },
      {
        id: 'totpickup',
        Header: 'Qty Pickup',
        accessor: 'totpickup',
        Cell: ({ row }) => {
          const { totpickup } = row.original;
          return (
            <Stack>
              <Typography variant="body1" color="secondary">
                {totpickup}
              </Typography>
            </Stack>
          );
        }
      },
      {
        id: 'ctg',
        Header: 'Kategori',
        accessor: 'ctg',
        Cell: ({ row }) => {
          return <Typography color="secondary">{row.original.ctg}</Typography>;
        }
      }
    ],
    []
  );

  return column;
}
