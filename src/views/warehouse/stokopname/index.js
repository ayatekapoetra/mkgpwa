'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { Filter } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import { useGetStokopnames } from 'api/stokopname';
import FilterStokopname from './filter';

moment.locale('id');

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Stockopname', to: '/warehouse/stokopname' }
];

const statusConfig = {
  draft: { color: 'default', label: 'Draft' },
  open: { color: 'info', label: 'Open' },
  approval: { color: 'warning', label: 'Approval' },
  close: { color: 'success', label: 'Close' }
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatQty = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('id-ID', { maximumFractionDigits: 2 });
};

export default function StokopnameScreen() {
  const [filters, setFilters] = useState({ page: 1, perPage: 25 });
  const [openFilter, setOpenFilter] = useState(false);
  const { rows, total, page, perPage, lastPage, summary, dataLoading } = useGetStokopnames(filters);

  return (
    <Fragment>
      <Breadcrumbs custom heading="Stockopname" links={breadcrumbLinks} />
      <MainCard
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button component={Link} href="/warehouse/stokopname/create" variant="contained" size="small">
              Buat Stockopname
            </Button>
          </Stack>
        }
        secondary={
          <IconButton onClick={() => setOpenFilter(true)} size="small">
            <Filter />
          </IconButton>
        }
        content
      >
        {summary ? (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`Draft: ${summary.draft || 0}`} variant="outlined" />
            <Chip size="small" label={`Open: ${summary.open || 0}`} variant="outlined" color="info" />
            <Chip size="small" label={`Approval: ${summary.approval || 0}`} variant="outlined" color="warning" />
            <Chip size="small" label={`Close: ${summary.close || 0}`} variant="outlined" color="success" />
            {/* <Chip size="small" label={`Total Nilai: ${formatCurrency(summary.total_diff_value)}`} color="primary" /> */}
          </Stack>
        ) : null}

        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900, whiteSpace: 'nowrap' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Kode</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Tanggal</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Bisnis</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Gudang</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Kode Rack</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Qty Sistem</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Qty Aktual</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Selisih</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Nilai</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dataLoading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada data stockopname.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const status = statusConfig[row.status] || { color: 'default', label: row.status };
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {row.kode || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.opname_date ? moment(row.opname_date).format('DD-MM-YYYY') : '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.bisnis_name || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.gudang_code ? `${row.gudang_code} - ${row.gudang_name || ''}` : '-'}
                        {row.created_by_name ? (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
                            {row.created_by_name}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {row.rack_code || '-'}
                        </Typography>
                        {row.rack_name ? (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 140 }}>
                            {row.rack_name}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatQty(row.total_qty_system)}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatQty(row.total_qty_aktual)}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatQty(row.total_diff)}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatCurrency(row.total_value)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Chip size="small" label={status.label} color={status.color} sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Button component={Link} href={`/warehouse/stokopname/${row.id}`} size="small" variant="outlined">
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
        <Paginate
          page={page}
          total={total}
          lastPage={lastPage}
          perPage={perPage}
          onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
        />
      </MainCard>
      <FilterStokopname
        count={total}
        data={filters}
        setData={setFilters}
        open={openFilter}
        onClose={() => setOpenFilter(false)}
      />
    </Fragment>
  );
}
