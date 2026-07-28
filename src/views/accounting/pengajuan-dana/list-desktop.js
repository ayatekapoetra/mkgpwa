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
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center">Aksi</TableCell>
            <TableCell>Kode</TableCell>
            <TableCell>Tanggal</TableCell>
            <TableCell>Narasi</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Items</TableCell>
            <TableCell align="center">File</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell align="center">
                <Button size="small" variant="outlined" component={Link} href={`/pengajuan-dana/${row.id}`}>
                  Detail
                </Button>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={700}>{row.kode || '-'}</Typography>
              </TableCell>
              <TableCell>{row.trx_date ? moment(row.trx_date).format('DD MMM YYYY') : '-'}</TableCell>
              <TableCell>
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
              <TableCell align="right">{formatCurrency(row.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
