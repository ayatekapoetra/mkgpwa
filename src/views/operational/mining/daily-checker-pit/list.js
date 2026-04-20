'use client';

import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Typography,
  Paper
} from '@mui/material';

const shiftLabel = (shiftId) => {
  if (String(shiftId) === '1') return 'Pagi';
  if (String(shiftId) === '2') return 'Siang';
  if (String(shiftId) === '3') return 'Malam';
  return '-';
};

export default function CheckerPitList({ rows, onOpenDetail }) {
  if (!rows || rows.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Belum ada data Checker PIT sesuai filter.
        </Typography>
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tanggal</TableCell>
            <TableCell>Shift</TableCell>
            <TableCell>Excavator</TableCell>
            <TableCell>PIT</TableCell>
            <TableCell>Material</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Pending</TableCell>
            <TableCell align="right">Synced</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow hover key={row.key}>
              <TableCell>{row.date_ops || '-'}</TableCell>
              <TableCell>{shiftLabel(row.shift_id)}</TableCell>
              <TableCell>{row.excavator_kode || '-'}</TableCell>
              <TableCell>{row.pit_nama || '-'}</TableCell>
              <TableCell>{row.material_nama || '-'}</TableCell>
              <TableCell align="right">{row.total_ritase || 0}</TableCell>
              <TableCell align="right">{row.pending || 0}</TableCell>
              <TableCell align="right">{row.synced || 0}</TableCell>
              <TableCell>
                <Chip
                  label={row.session_status || '-'}
                  size="small"
                  color={row.session_status === 'CLOSED' ? 'success' : 'warning'}
                  variant={row.session_status === 'CLOSED' ? 'filled' : 'outlined'}
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" onClick={() => onOpenDetail(row)}>
                    Detail
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
