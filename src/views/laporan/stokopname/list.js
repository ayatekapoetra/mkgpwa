'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const display = (value, fallback = '-') => (value === undefined || value === null || value === '' ? fallback : value);

const formatDate = (value) => {
  if (!value) return '-';
  const parts = String(value).slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : String(value);
};

export default function StokopnameReportList({ data, total, page, perPage, lastPage, initialLoading, refreshing, onPageChange, onRowsPerPageChange }) {
  const theme = useTheme();
  const headerSx = {
    bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    borderColor: 'divider',
    verticalAlign: 'middle'
  };
  const first = total ? (page - 1) * perPage + 1 : 0;
  const last = Math.min(page * perPage, total);

  return (
    <Paper variant="outlined" sx={{ position: 'relative', overflow: 'hidden' }}>
      {refreshing ? <LinearProgress sx={{ position: 'absolute', inset: '0 0 auto', zIndex: 6 }} /> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5} sx={{ p: 2 }}>
        <Typography variant="subtitle1">Data Stockopname per Rack</Typography>
        <TextField select size="small" label="Rows" value={perPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))} disabled={refreshing} sx={{ minWidth: 100 }}>
          {[25, 50, 100, 500].map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer sx={{ maxHeight: 640, overflowX: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 1200, whiteSpace: 'nowrap' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>No</TableCell>
              <TableCell sx={headerSx}>Cabang</TableCell>
              <TableCell sx={headerSx}>Gudang</TableCell>
              <TableCell sx={headerSx}>Kode Rack</TableCell>
              <TableCell sx={headerSx}>Nama Rack</TableCell>
              <TableCell sx={headerSx}>Petugas</TableCell>
              <TableCell sx={headerSx} align="center">Cycle Time</TableCell>
              <TableCell sx={headerSx} align="center">Terakhir SO</TableCell>
              <TableCell sx={headerSx} align="center">Status</TableCell>
              <TableCell sx={headerSx} align="center">Draft</TableCell>
              <TableCell sx={headerSx} align="center">Open</TableCell>
              <TableCell sx={headerSx} align="center">Approval</TableCell>
              <TableCell sx={headerSx} align="center">Close</TableCell>
              <TableCell sx={headerSx} align="center">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={14}>Memuat data...</TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Tidak ada data stockopname pada periode ini.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={`${row.rack_id}-${row.gudang_id}-${index}`} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{first + index}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{display(row.cabang_name)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.gudang_code ? `${row.gudang_code} - ${row.gudang_name}` : display(row.gudang_name)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{display(row.rack_code)}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{display(row.rack_name)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" color="text.secondary" noWrap>{display(row.last_opname_by)}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.cycle_time_days == null ? '-' : `${row.cycle_time_days} hari`}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.last_opname_at ? formatDate(row.last_opname_at) : '-'}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {row.locked ? <Chip size="small" label="Terkunci" color="error" /> : <Chip size="small" label="Aman" color="success" variant="outlined" />}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.draft || 0}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.open || 0}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.approval || 0}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{row.close || 0}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Typography fontWeight={700}>{row.total || 0}</Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          Menampilkan {first}-{last} dari {total.toLocaleString('id-ID')} rack
        </Typography>
        <Pagination count={lastPage} page={Math.min(page, lastPage)} onChange={(_, value) => onPageChange(value)} disabled={refreshing} color="primary" showFirstButton showLastButton />
      </Stack>
    </Paper>
  );
}
