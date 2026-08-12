'use client';

import moment from 'moment';

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

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
};

const formatWorkingHours = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  return formatNumber(value);
};

const formatDate = (value) => {
  const date = moment(value, 'YYYY-MM-DD', true);
  return date.isValid() ? date.format('DD MMM YYYY') : '-';
};

export default function ListOperatingHistory({
  detail = false,
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
  const columnCount = detail ? 12 : 9;
  const headerBg = theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200];
  const headerCellSx = {
    backgroundColor: headerBg,
    border: `1px solid ${theme.palette.divider}`,
    whiteSpace: 'nowrap',
    fontWeight: 700,
    textAlign: 'center',
    verticalAlign: 'middle',
    lineHeight: 1.25,
    py: 1
  };
  const numericCellSx = { whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <Paper sx={{ overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1">Data Operating History{detail ? ' Detail' : ''}</Typography>
          <Typography variant="caption" color="text.secondary">Perbandingan Daily Activity dan Timesheet per penyewa dan unit (lintas lokasi)</Typography>
        </Stack>
        <TextField
          select
          size="small"
          label="Rows"
          value={perPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          sx={{ minWidth: 96 }}
        >
          {[10, 25, 50, 100].map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto', position: 'relative' }}>
        <Table sx={{ minWidth: detail ? 1440 : 1000 }}>
          <TableHead
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              backgroundColor: headerBg,
              '& .MuiTableCell-root': {
                backgroundColor: headerBg
              }
            }}
          >
            <TableRow>
              <TableCell sx={headerCellSx} rowSpan={2}>No</TableCell>
              <TableCell sx={headerCellSx} rowSpan={2}>Site Project</TableCell>
              {detail ? <TableCell sx={headerCellSx} rowSpan={2}>Date</TableCell> : null}
              {detail ? <TableCell sx={headerCellSx} rowSpan={2}>Shift</TableCell> : null}
              <TableCell sx={headerCellSx} rowSpan={2}>ID Unit</TableCell>
              {detail ? <TableCell sx={headerCellSx} rowSpan={2}>Driver/Operator</TableCell> : null}
              <TableCell sx={headerCellSx} rowSpan={2}>Type</TableCell>
              <TableCell sx={headerCellSx} rowSpan={2} align="right">HM/KM</TableCell>
              <TableCell sx={headerCellSx} rowSpan={2} align="right">Working Hours</TableCell>
              <TableCell sx={headerCellSx} colSpan={2} align="center">Operating Hours</TableCell>
              <TableCell sx={headerCellSx} rowSpan={2} align="right">Diff</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={headerCellSx} align="right">DA</TableCell>
              <TableCell sx={headerCellSx} align="right">TS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columnCount} align="center">Loading...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={columnCount} align="center">Tidak ada data</TableCell></TableRow>
            ) : (
              data.map((row) => {
                const key = detail
                  ? `${row.site_project_id}-${row.date_ops}-${row.shift_id}-${row.equipment_id}-${row.employee_id}-${row.type}-${row.no}`
                  : `${row.site_project_id}-${row.equipment_id}-${row.type}-${row.no}`;
                const diff = Number(row.diff) || 0;

                return (
                  <TableRow key={key} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.no}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}><Typography variant="body" fontWeight={600}>{row.site_project_name || '-'}</Typography></TableCell>
                    {detail ? <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.date_ops)}</TableCell> : null}
                    {detail ? <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.shift_name || '-'}</TableCell> : null}
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{row.equipment_code || '-'}</TableCell>
                    {detail ? <TableCell sx={{ minWidth: 180 }}>{row.employee_name || '-'}</TableCell> : null}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.type || ''}</TableCell>
                    <TableCell sx={numericCellSx}>{formatNumber(row.hmkm)}</TableCell>
                    <TableCell sx={numericCellSx}>{formatWorkingHours(row.working_hours)}</TableCell>
                    <TableCell sx={numericCellSx}>{formatNumber(row.da_operating_hours)}</TableCell>
                    <TableCell sx={numericCellSx}>{formatNumber(row.ts_operating_hours)}</TableCell>
                    <TableCell sx={{ ...numericCellSx, color: diff === 0 ? 'success.main' : diff > 0 ? 'warning.main' : 'error.main', fontWeight: 700 }}>
                      {formatNumber(diff)}
                    </TableCell>
                  </TableRow>
                );
              })
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
