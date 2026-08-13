'use client';

import moment from 'moment';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';

import Paginate from 'components/Paginate';

const StatusChip = ({ status }) => {
  const isClose = status === 'close';
  return <Chip label={isClose ? 'Close' : 'Open'} size="small" color={isClose ? 'success' : 'warning'} variant={isClose ? 'filled' : 'outlined'} />;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = moment(value, ['YYYY-MM-DD HH:mm:ss', 'DD-MM-YYYY HH:mm', moment.ISO_8601], true);
  return parsed.isValid() ? parsed.format('DD MMM YYYY HH:mm') : '-';
};

const formatDurationDecimal = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const parsed = Number(value);
  return Number.isNaN(parsed) ? '-' : parsed.toFixed(2);
};

export default function ListSummaryBreakdown({
  data = [],
  total = 0,
  totalDuration = 0,
  totalEquipment = 0,
  totalStatusOpen = 0,
  totalStatusClose = 0,
  page = 1,
  perPage = 25,
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

  return (
    <Paper sx={{ overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1">Data Summary Breakdown</Typography>
        <TextField
          select
          size="small"
          label="Rows"
          value={perPage}
          onChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))}
          sx={{ minWidth: 96 }}
        >
          {[10, 25, 50, 100].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

        <TableContainer sx={{ maxHeight: '70vh', overflowX: 'auto', position: 'relative' }}>
        <Table stickyHeader sx={{ minWidth: 1440 }}>
          <TableHead
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 3
            }}
          >
            <TableRow>
              <TableCell sx={headerCellSx}>No</TableCell>
              <TableCell sx={headerCellSx}>Penyewa</TableCell>
              <TableCell sx={headerCellSx}>Location</TableCell>
              <TableCell sx={headerCellSx}>Breakdown</TableCell>
              <TableCell sx={headerCellSx}>Ready</TableCell>
              <TableCell sx={headerCellSx}>Durasi</TableCell>
              <TableCell sx={headerCellSx}>HM/KM</TableCell>
              <TableCell sx={headerCellSx}>Type</TableCell>
              <TableCell sx={headerCellSx}>ID Unit</TableCell>
              <TableCell sx={headerCellSx}>Problem</TableCell>
              <TableCell sx={headerCellSx}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">Loading...</TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">Tidak ada data</TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.no}</TableCell>
                    <TableCell sx={{ minWidth: 180, whiteSpace: 'normal', verticalAlign: 'top' }}>{row.penyewa_name || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 180, whiteSpace: 'normal', verticalAlign: 'top' }}>
                      <Typography variant="body2" fontWeight={600}>{row.location_name || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.cabang_name || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.breakdown_at_label || formatDateTime(row.breakdown_at)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.ready_at_label || formatDateTime(row.ready_at)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatDurationDecimal(row.duration_decimal)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.smu ?? '-'}</TableCell>
                    <TableCell sx={{ minWidth: 180, whiteSpace: 'normal', verticalAlign: 'top' }}>{row.equipment_model || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.equipment_code || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 320, whiteSpace: 'normal', verticalAlign: 'top' }}>
                      <Box>{row.problem_summary || '-'}</Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <StatusChip status={row.status} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50]
        }}
      >
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={3} useFlexGap flexWrap="wrap">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Total Durasi (Jam)
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {formatDurationDecimal(totalDuration)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Total Equipment
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {totalEquipment}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Total Open
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {totalStatusOpen}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Total Close
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {totalStatusClose}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Paginate page={page} lastPage={Math.max(Math.ceil(total / perPage), 1)} total={total} onPageChange={onPageChange} />
      </Box>
    </Paper>
  );
}
