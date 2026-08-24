'use client';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
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

import Paginate from 'components/Paginate';

const durationColumns = [
  { key: 'breakdown', label: 'Breakdown', color: 'error' },
  { key: 'no_operator_driver', label: 'No Opr/Drv', color: 'error' },
  { key: 'no_job', label: 'No Job', color: 'success' },
  { key: 'fuel', label: 'Fuel', color: 'success' },
  { key: 'hujan', label: 'Hujan', color: 'success' },
  { key: 'jalan_licin', label: 'Jalan Licin', color: 'success' },
  { key: 'public', label: 'Public', color: 'success' },
  { key: 'arahan', label: 'Arahan', color: 'success' },
  { key: 'commissioning', label: 'Commissioning', color: 'success' }
];

const formatHours = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return '-';
  return number.toFixed(2);
};

export default function ListCustomersEventHistory({
  data = [],
  total = 0,
  page = 1,
  perPage = 25,
  lastPage = 1,
  loading = false,
  onPageChange,
  onRowsPerPageChange
}) {
  const theme = useTheme();
  const headerCellSx = {
    position: 'sticky',
    top: 0,
    zIndex: 3,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
    borderBottom: `1px solid ${theme.palette.divider}`,
    whiteSpace: 'nowrap',
    fontWeight: 700
  };
  const numericCellSx = { whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const durationHeaderCellSx = (color) => ({
    ...headerCellSx,
    // backgroundColor: theme.palette[color].main,
    backgroundColor: theme.palette[color].lighter,
    color: theme.palette.mode === 'dark' ? theme.palette.common.dark : '#000',
    // color: theme.palette.common.white
  });
  const durationBodyCellSx = (color) => ({
    ...numericCellSx,
    // backgroundColor: theme.palette[color].darker,
    // color: theme.palette.mode === 'dark' ? '#000' : theme.palette.common.white,
    fontWeight: 700
  });

  return (
    <Paper sx={{ overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1">Data Event History</Typography>
          <Typography variant="caption" color="text.secondary">Akumulasi durasi event khusus data pelanggan Anda</Typography>
        </Stack>
        <TextField select size="small" label="Rows" value={perPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))} sx={{ minWidth: 96 }}>
          {[10, 25, 50, 100].map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Stack>

        <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto', position: 'relative' }}>
        <Table stickyHeader sx={{ minWidth: 1420 }}>
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 4 }}>
            <TableRow>
              <TableCell sx={headerCellSx}>No</TableCell>
              <TableCell sx={headerCellSx}>Penyewa</TableCell>
              <TableCell sx={headerCellSx}>ID Unit</TableCell>
              {durationColumns.map(({ key, label, color }) => <TableCell key={key} sx={durationHeaderCellSx(color)} align="right">{label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={12} align="center">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={12} align="center">Tidak ada data</TableCell></TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={`${row.site_project_id}-${row.equipment_id}-${row.no}`} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.no}</TableCell>
                  <TableCell sx={{ minWidth: 180 }}><Typography variant="body" fontWeight={600}>{row.site_project_name || '-'}</Typography></TableCell>
                  <TableCell sx={{ minWidth: 130, whiteSpace: 'nowrap', fontWeight: 600 }}>{row.equipment_code || '-'}</TableCell>
                  {durationColumns.map(({ key, color }) => <TableCell key={key} sx={durationBodyCellSx(color)}>{formatHours(row[key])}</TableCell>)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Paginate page={page} lastPage={lastPage} total={total} onPageChange={onPageChange} />
      </Box>
    </Paper>
  );
}
