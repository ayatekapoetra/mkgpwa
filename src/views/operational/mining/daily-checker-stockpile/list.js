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
  Paper,
  TablePagination
} from '@mui/material';

const shiftLabel = (shiftId) => {
  if (String(shiftId) === '1') return 'Pagi';
  if (String(shiftId) === '2') return 'Siang';
  if (String(shiftId) === '3') return 'Malam';
  return '-';
};

export default function CheckerStockpileList({
  rows,
  totalCount,
  onOpenDetail,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}) {
  if (!rows || rows.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Belum ada data Checker Stockpile sesuai filter.
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
            <TableCell>Stockpile</TableCell>
            <TableCell>Material</TableCell>
            <TableCell>DOM</TableCell>
            <TableCell align="right">Dumptruck</TableCell>
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
              <TableCell>{row.stockpile_nama || '-'}</TableCell>
              <TableCell>{row.material_nama || '-'}</TableCell>
              <TableCell>{row.dom_code || '-'}</TableCell>
              <TableCell align="right">{row.total_dumptruck || 0}</TableCell>
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
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Baris per halaman"
      />
    </TableContainer>
  );
}
