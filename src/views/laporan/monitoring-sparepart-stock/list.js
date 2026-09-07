'use client';

import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
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
import { useTheme } from '@mui/material/styles';
import { Eye } from 'iconsax-react';

const quantityFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 });
const moneyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const display = (value, fallback = '-') => (value === undefined || value === null || value === '' ? fallback : value);
export const formatQuantity = (value) => (Number.isFinite(Number(value)) ? quantityFormatter.format(Number(value)) : '-');
export const formatMoney = (value) => (Number.isFinite(Number(value)) ? moneyFormatter.format(Number(value)) : '-');

export default function MonitoringSparepartStockList({ data, total, page, perPage, lastPage, initialLoading, refreshing, onPageChange, onRowsPerPageChange, onDetail }) {
  const theme = useTheme();
  const headerSx = { bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', fontWeight: 700, whiteSpace: 'nowrap', verticalAlign: 'middle' };
  const numericSx = { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };
  const first = total ? (page - 1) * perPage + 1 : 0;
  const last = Math.min(page * perPage, total);

  return (
    <Paper variant="outlined" sx={{ position: 'relative', overflow: 'hidden' }}>
      {refreshing ? <LinearProgress sx={{ position: 'absolute', inset: '0 0 auto', zIndex: 6 }} /> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5} sx={{ p: 2 }}>
        <Stack><Typography variant="subtitle1">Posisi Stock per Rack</Typography><Typography variant="caption" color="text.secondary">Klik baris untuk melihat movement history</Typography></Stack>
        <TextField select size="small" label="Rows" value={perPage} onChange={(event) => onRowsPerPageChange(Number(event.target.value))} disabled={refreshing} sx={{ minWidth: 100 }}>
          {[25, 50, 100, 500].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
        </TextField>
      </Stack>
      <TableContainer sx={{ maxHeight: '68vh', overflow: 'auto' }}>
        <Table sx={{ minWidth: 2050, '& .MuiTableCell-root': { verticalAlign: 'top' } }}>
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 5, '& .MuiTableCell-root': { verticalAlign: 'middle' } }}>
            <TableRow>
              <TableCell sx={headerSx}>No</TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 145 }}>Business</TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 175 }}>Warehouse</TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 135 }}>Rack</TableCell>
              <TableCell sx={{ ...headerSx, minWidth: 260 }}>Item / Part Number</TableCell>
              <TableCell align="right" sx={headerSx}>Stock Order</TableCell>
              <TableCell align="right" sx={headerSx}>Stock Used</TableCell>
              <TableCell align="right" sx={headerSx}>Avg Price</TableCell>
              <TableCell align="right" sx={headerSx}>Avg Value</TableCell>
              <TableCell align="right" sx={headerSx}>Actual Price</TableCell>
              <TableCell align="right" sx={headerSx}>Actual Value</TableCell>
              <TableCell sx={headerSx}>Price Status</TableCell>
              <TableCell align="center" sx={headerSx}>History</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialLoading ? Array.from({ length: 6 }, (_, index) => <TableRow key={index}>{Array.from({ length: 13 }, (__, cell) => <TableCell key={cell}><Skeleton width={cell === 4 ? 190 : 70} /></TableCell>)}</TableRow>) : null}
            {!initialLoading && !data.length ? <TableRow><TableCell colSpan={13} align="center" sx={{ py: 8 }}><Typography variant="subtitle1">Tidak ada stock sesuai filter</Typography><Typography variant="body2" color="text.secondary">Ubah atau reset filter untuk melihat data lainnya.</Typography></TableCell></TableRow> : null}
            {!initialLoading && data.map((row, index) => {
              const canOpen = Boolean(row.warehouse_id && row.rack_id && row.item_id);
              const openDetail = () => { if (canOpen) onDetail(row); };
              return (
                <TableRow
                  key={[row.business_id, row.warehouse_id, row.rack_id, row.item_id, row.stable_id].join('-')}
                  hover
                  tabIndex={canOpen ? 0 : -1}
                  role={canOpen ? 'button' : undefined}
                  aria-label={canOpen ? `Lihat movement ${display(row.item_code, row.item_id)}` : undefined}
                  onClick={openDetail}
                  onKeyDown={(event) => { if (canOpen && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openDetail(); } }}
                  sx={{ cursor: canOpen ? 'pointer' : 'default', '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 } }}
                >
                  <TableCell>{display(row.no, (page - 1) * perPage + index + 1)}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700}>{display(row.business_code)}</Typography><Typography variant="caption" color="text.secondary">{display(row.business_name, '')}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} noWrap>{display(row.warehouse_code)}</Typography><Typography variant="caption" color="text.secondary" noWrap>{display(row.warehouse_name, '')}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700}>{display(row.rack_code)}</Typography><Typography variant="caption" color="text.secondary">{display(row.rack_name, '')}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="primary" fontWeight={700}>{display(row.item_code)}</Typography><Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 280 }}>{display(row.item_name)}</Typography><Typography variant="caption" color="text.secondary">PN: {display(row.part_number)}</Typography></TableCell>
                  <TableCell align="right" sx={{ ...numericSx, color: Number(row.stock_order) < 0 ? 'error.main' : 'inherit', fontWeight: 700 }}>{formatQuantity(row.stock_order)} {display(row.order_uom, '')}</TableCell>
                  <TableCell align="right" sx={numericSx}>{formatQuantity(row.stock_used)} {display(row.used_uom, '')}</TableCell>
                  <TableCell align="right" sx={numericSx}>{formatMoney(row.avg_unit_price)}</TableCell>
                  <TableCell align="right" sx={{ ...numericSx, fontWeight: 600 }}>{formatMoney(row.avg_stock_value)}</TableCell>
                  <TableCell align="right" sx={numericSx}>{row.price_available === false ? <Typography variant="caption" color="warning.main">Harga belum tersedia</Typography> : formatMoney(row.actual_unit_price)}</TableCell>
                  <TableCell align="right" sx={{ ...numericSx, fontWeight: 700 }}>{formatMoney(row.actual_stock_value)}</TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={row.price_status === 'act' ? 'Actual' : 'Fallback'} color={row.price_status === 'act' ? 'success' : 'warning'} /></TableCell>
                  <TableCell align="center"><Tooltip title="Movement history"><span><IconButton size="small" color="primary" aria-label={`Movement history ${display(row.item_code, row.item_id)}`} disabled={!canOpen} onClick={(event) => { event.stopPropagation(); openDetail(); }}><Eye size={19} /></IconButton></span></Tooltip></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">Menampilkan {first}-{last} dari {total.toLocaleString('id-ID')} data</Typography>
        <Pagination count={lastPage} page={Math.min(page, lastPage)} onChange={(_, value) => onPageChange(value)} disabled={refreshing} color="primary" showFirstButton showLastButton />
      </Stack>
    </Paper>
  );
}
