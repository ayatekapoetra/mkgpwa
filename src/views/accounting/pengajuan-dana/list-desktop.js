'use client';

import Link from 'next/link';
import moment from 'moment';

import { Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const statusColor = (status, lastAction) => {
  if (status === 'open' && lastAction === 'returned') return 'warning';
  if (status === 'open') return 'default';
  if (status === 'approval') return 'info';
  if (status === 'close') return 'success';
  if (status === 'reject') return 'error';
  return 'default';
};

const statusLabel = (status, lastAction) => {
  if (status === 'open' && lastAction === 'returned') return 'Open - Perlu Revisi';
  return status || '-';
};

export default function PengajuanDanaListDesktop({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Belum ada data pengajuan non part sesuai filter.
        </Typography>
      </Stack>
    );
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}
    >
      <Table size="small" sx={{ minWidth: 1050 }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Aksi</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 180 }}>Kode</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 125 }}>Tanggal</TableCell>
            <TableCell sx={{ minWidth: 300 }}>Narasi</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 140 }}>Status</TableCell>
            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Items</TableCell>
            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>File</TableCell>
            <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                <Button size="small" variant="outlined" component={Link} href={`/pengajuan-dana/${row.id}`}>
                  Detail
                </Button>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="body2" fontWeight={700} noWrap>{row.kode || '-'}</Typography>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.trx_date ? moment(row.trx_date).format('DD MMM YYYY') : '-'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2">{row.narasi || '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.creator?.nama_lengkap || '-'}</Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Chip size="small" color={statusColor(row.status, row.last_action)} label={statusLabel(row.status, row.last_action)} />
              </TableCell>
              <TableCell align="center">{row.items_count || 0}</TableCell>
              <TableCell align="center">{row.files_count || 0}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{formatCurrency(row.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
