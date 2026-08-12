'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useTheme } from '@mui/material/styles';

import Paginate from 'components/Paginate';

const formatDecimal = (value) => {
  if (value === null || value === undefined || value === '') return '0.0';
  const parsed = Number(value);
  return Number.isNaN(parsed) ? '0.0' : parsed.toFixed(1);
};

const formatPercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return '-';
  return (parsed * 100).toFixed(1);
};

const getPercentValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  return parsed * 100;
};

const PercentText = ({ value }) => {
  const percent = getPercentValue(value);
  if (percent === null) return '-';
  const isDanger = percent < 95;
  return (
    <Typography
      variant="body"
      sx={{
        fontWeight: 700,
        color: (theme) => isDanger ? theme.palette.error.main : theme.palette.success.main
      }}
    >
      {percent.toFixed(1)}
    </Typography>
  );
};

const FIXED_COLUMNS = [
  { id: 'no', label: 'No', fixed: true },
  { id: 'project', label: 'Penyewa', fixed: true },
  { id: 'id_unit', label: 'ID Unit', fixed: true }
];

const TOGGLEABLE_COLUMNS = [
  { id: 'type', label: 'Type' },
  { id: 'hmkm', label: 'HM/KM' },
  { id: 'standby', label: 'Standby' },
  { id: 'opportunity', label: 'Opportunity' },
  { id: 'operating', label: 'Operating' },
  { id: 'wh', label: 'WH' },
  { id: 'pa', label: 'PA' },
  { id: 'ma', label: 'MA' },
  { id: 'ua', label: 'UA' },
  { id: 'eu', label: 'EU' },
  { id: 'mttfs', label: 'MTTFS' },
  { id: 'mttr', label: 'MTTR' },
  { id: 'mtbs', label: 'MTBS' },
  { id: 'mtbf', label: 'MTBF' }
];

const ALL_COLUMNS = [...FIXED_COLUMNS, ...TOGGLEABLE_COLUMNS];

const renderCell = (column, row, formatDecimalFn, formatPercentFn) => {
  switch (column.id) {
    case 'no':
      return row.no;
    case 'project':
      return <Typography variant="body" fontWeight={600}>{row.penyewa_name || '-'}</Typography>;
    case 'id_unit':
      return row.equipment_code || '-';
    case 'type':
      return row.equipment_type || '-';
    case 'hmkm':
      return formatDecimalFn(row.hmkm);
    case 'standby':
      return formatDecimalFn(row.standby);
    case 'opportunity':
      return formatDecimalFn(row.opportunity);
    case 'operating':
      return formatDecimalFn(row.operating);
    case 'wh':
      return formatDecimalFn(row.WH);
    case 'pa':
      return <PercentText value={row.PA} />;
    case 'ma':
      return <PercentText value={row.MA} />;
    case 'ua':
      return <PercentText value={row.UA} />;
    case 'eu':
      return <PercentText value={row.EU} />;
    case 'mttfs':
      return formatDecimalFn(row.MTTFS);
    case 'mttr':
      return formatDecimalFn(row.MTTR);
    case 'mtbs':
      return formatDecimalFn(row.MTBS);
    case 'mtbf':
      return formatDecimalFn(row.MTBF);
    default:
      return '-';
  }
};

const cellSx = { whiteSpace: 'nowrap', verticalAlign: 'top' };

const METRIC_LOADING_KEYS = {
  hmkm: 'hmkm',
  standby: 'standby',
  opportunity: 'opportunity',
  operating: 'operating',
  wh: 'PA',
  pa: 'PA',
  ma: 'MA',
  ua: 'UA',
  eu: 'EU',
  mttfs: 'MTTFS',
  mttr: 'MTTR',
  mtbs: 'MTBS',
  mtbf: 'MTBF'
};

const CENTERED_COLUMN_IDS = new Set([
  'hmkm', 'standby', 'opportunity', 'operating', 'wh',
  'pa', 'ma', 'ua', 'eu', 'mttfs', 'mttr', 'mtbs', 'mtbf'
]);

const MetricCell = ({ column, row, metricLoading, formatDecimalFn, formatPercentFn }) => {
  const loadingKey = METRIC_LOADING_KEYS[column.id];
  const isLoading = loadingKey && metricLoading?.[loadingKey];
  const isCentered = CENTERED_COLUMN_IDS.has(column.id);
  const centerSx = isCentered ? { ...cellSx, textAlign: 'center' } : cellSx;

  if (isLoading) {
    return (
      <TableCell key={column.id} sx={centerSx}>
        <CircularProgress size={16} />
      </TableCell>
    );
  }

  if (column.id === 'project') {
    return (
      <TableCell key={column.id} sx={{ minWidth: 200, whiteSpace: 'normal', verticalAlign: 'top' }}>
        {renderCell(column, row, formatDecimalFn, formatPercentFn)}
      </TableCell>
    );
  }

  return (
    <TableCell key={column.id} sx={centerSx}>
      {renderCell(column, row, formatDecimalFn, formatPercentFn)}
    </TableCell>
  );
};

export default function ListProductivity({
  data = [],
  total = 0,
  page = 1,
  perPage = 25,
  loading = false,
  metricLoading = {},
  onPageChange,
  onRowsPerPageChange
}) {
  const theme = useTheme();
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnAnchor, setColumnAnchor] = useState(null);

  const visibleColumns = useMemo(
    () => ALL_COLUMNS.filter((col) => !hiddenColumns.includes(col.id)),
    [hiddenColumns]
  );

  const headerCellSx = {
    position: 'sticky',
    top: 0,
    zIndex: 3,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
    borderBottom: `1px solid ${theme.palette.divider}`,
    whiteSpace: 'nowrap',
    fontWeight: 700
  };

  const handleColumnToggle = (columnId) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  };

  const handleColumnOpen = (event) => setColumnAnchor(event.currentTarget);
  const handleColumnClose = () => setColumnAnchor(null);

  const minWidth = visibleColumns.length * 110;

  return (
    <Paper sx={{ overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1">Data Productivity</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Show/Hide Columns">
            <IconButton aria-label="toggle-columns" variant="dashed" color="secondary" onClick={handleColumnOpen}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
          <Popover
            open={Boolean(columnAnchor)}
            anchorEl={columnAnchor}
            onClose={handleColumnClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { p: 1, maxHeight: 400, overflowY: 'auto' } }}
          >
            <Typography variant="subtitle2" sx={{ px: 1, py: 0.5 }}>Toggle Columns</Typography>
            {TOGGLEABLE_COLUMNS.map((col) => (
              <MenuItem
                key={col.id}
                onClick={() => handleColumnToggle(col.id)}
                sx={{ py: 0.25, minHeight: 32 }}
              >
                <Checkbox checked={!hiddenColumns.includes(col.id)} size="small" sx={{ p: 0.25 }} />
                <ListItemText primary={col.label} primaryTypographyProps={{ variant: 'body2' }} />
              </MenuItem>
            ))}
          </Popover>
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
      </Stack>

      <TableContainer sx={{ maxHeight: '70vh', overflowX: 'auto', position: 'relative' }}>
        <Table stickyHeader sx={{ minWidth }}>
          <TableHead
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 3
            }}
          >
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell key={column.id} sx={{ ...headerCellSx, ...(CENTERED_COLUMN_IDS.has(column.id) ? { textAlign: 'center' } : {}) }}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} align="center">Loading...</TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} align="center">Tidak ada data</TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={row.row_key || `${row.equipment_id || row.equipment_code}-${index}`} hover>
                  {visibleColumns.map((column) => (
                    <MetricCell
                      key={column.id}
                      column={column}
                      row={row}
                      metricLoading={metricLoading}
                      formatDecimalFn={formatDecimal}
                      formatPercentFn={formatPercent}
                    />
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Paginate page={page} lastPage={Math.max(Math.ceil(total / perPage), 1)} total={total} onPageChange={onPageChange} />
      </Box>
    </Paper>
  );
}