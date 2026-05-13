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
import moment from 'moment';
import 'moment/locale/id';

const shiftLabel = (shiftId) => {
  if (String(shiftId) === '1') return 'Siang';
  if (String(shiftId) === '2') return 'Malam';
  if (String(shiftId) === '3') return 'Offices';
  return '-';
};

export default function CheckerPitList({
  rows,
  totalCount,
  onOpenDetail,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}) {
  const formatTanggal = (value) => {
    if (!value) return '-';
    const parsed = moment(value);
    if (!parsed.isValid()) return value;
    return parsed.locale('id').format('DD MMMM YYYY');
  };
  
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
            <TableCell align="right">DT</TableCell>
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
              <TableCell>{formatTanggal(row.date_ops)}</TableCell>
              <TableCell>{shiftLabel(row.shift_id)}</TableCell>
              <TableCell>{row.excavator_kode || '-'}</TableCell>
              <TableCell align="right">{row.total_dumptruck || 0}</TableCell>
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
