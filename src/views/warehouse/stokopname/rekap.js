'use client';

import { Fragment } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import { APP_DEFAULT_PATH } from 'config';
import { useGetStokopnameRekap } from 'api/stokopname';

const formatQty = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('id-ID', { maximumFractionDigits: 2 });
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

function RekapTable({ title, rows, color = 'primary' }) {
  if (rows.length === 0) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Chip size="small" label={`${title} (${rows.length})`} color={color} />
      </Stack>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Barang</TableCell>
              <TableCell>Rack</TableCell>
              <TableCell align="right">Qty Sistem</TableCell>
              <TableCell align="right">Qty Aktual</TableCell>
              <TableCell align="right">Selisih</TableCell>
              <TableCell align="right">Harga</TableCell>
              <TableCell align="right">Nilai</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {row.kd_barang || '-'} — {row.nm_barang || '-'}
                  </Typography>
                </TableCell>
                <TableCell>{row.rack_code || '-'}</TableCell>
                <TableCell align="right">{formatQty(row.qty_system)}</TableCell>
                <TableCell align="right">{formatQty(row.qty_aktual)}</TableCell>
                <TableCell align="right">{formatQty(row.diff)}</TableCell>
                <TableCell align="right">{formatCurrency(row.harga_uom)}</TableCell>
                <TableCell align="right">{formatCurrency(row.total_uom)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

export default function StokopnameRekapScreen({ id }) {
  const { data, dataLoading, dataError } = useGetStokopnameRekap(id);

  if (dataLoading) {
    return (
      <Stack sx={{ py: 8 }} alignItems="center">
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (dataError || !data) {
    return <Alert severity="warning">Gagal memuat data rekap.</Alert>;
  }

  const { header, summary, groups } = data;

  return (
    <Fragment>
      <Breadcrumbs
        custom
        heading={`Rekap ${header.kode || ''}`}
        links={[
          { title: 'Home', to: APP_DEFAULT_PATH },
          { title: 'Stockopname', to: '/warehouse/stokopname' },
          { title: header.kode || 'Detail', to: `/warehouse/stokopname/${id}` },
          { title: 'Rekap', to: `/warehouse/stokopname/${id}/rekap` }
        ]}
      />
      <MainCard title={<BtnBack href={`/warehouse/stokopname/${id}`} />} content>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`Qty Sistem: ${formatQty(summary.total_qty_system)}`} variant="outlined" />
            <Chip size="small" label={`Qty Aktual: ${formatQty(summary.total_qty_aktual)}`} variant="outlined" />
            <Chip size="small" label={`Selisih: ${formatQty(summary.total_diff)}`} color="warning" />
            <Chip size="small" label={`Nilai: ${formatCurrency(summary.total_value)}`} color="primary" />
          </Stack>

          <Divider />

          <RekapTable title="Over" rows={groups.over || []} color="success" />
          <RekapTable title="Lose" rows={groups.lose || []} color="error" />
          <RekapTable title="Balance" rows={groups.balance || []} color="default" />
          <RekapTable title="Non Harga" rows={groups.non_harga || []} color="secondary" />
        </Stack>
      </MainCard>
    </Fragment>
  );
}
