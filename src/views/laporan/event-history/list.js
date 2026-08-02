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
  ['breakdown', 'Breakdown'],
  ['no_operator_driver', 'No Opr/Drv'],
  ['fuel', 'Fuel'],
  ['hujan', 'Hujan'],
  ['jalan_licin', 'Jalan Licin'],
  ['public', 'Public'],
  ['no_job', 'No Job'],
  ['arahan', 'Arahan']
];

const formatHours = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
};

export default function ListEventHistory({
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

  return (
    <Paper sx={{ overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1">Data Event History</Typography>
          <Typography variant="caption" color="text.secondary">Akumulasi durasi event per location dan unit</Typography>
        </Stack>
        <TextField select size="small" label="Rows" value={perPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))} sx={{ minWidth: 96 }}>
          {[10, 25, 50, 100].map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto', position: 'relative' }}>
        <Table stickyHeader sx={{ minWidth: 1320 }}>
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 4 }}>
            <TableRow>
              <TableCell sx={headerCellSx}>No</TableCell>
              <TableCell sx={headerCellSx}>Location</TableCell>
              <TableCell sx={headerCellSx}>ID Unit</TableCell>
              {durationColumns.map(([key, label]) => <TableCell key={key} sx={headerCellSx} align="right">{label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={11} align="center">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={11} align="center">Tidak ada data</TableCell></TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={`${row.location_id}-${row.equipment_id}-${row.no}`} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.no}</TableCell>
                  <TableCell sx={{ minWidth: 180 }}><Typography variant="body2" fontWeight={600}>{row.location_name || '-'}</Typography></TableCell>
                  <TableCell sx={{ minWidth: 130, whiteSpace: 'nowrap', fontWeight: 600 }}>{row.equipment_code || '-'}</TableCell>
                  {durationColumns.map(([key]) => <TableCell key={key} sx={numericCellSx}>{formatHours(row[key])}</TableCell>)}
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
