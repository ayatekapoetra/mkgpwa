'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { useMonitoringStockDetail } from 'api/monitoring-stock-sparepart';
import { formatQuantity } from './list';

const display = (value, fallback = '-') => value === undefined || value === null || value === '' ? fallback : value;
const errorMessage = (error) => error?.response?.data?.diagnostic?.message || error?.diagnostic?.message || error?.message || 'Gagal memuat distribusi rack.';

export default function MonitoringStockDetail({ context, onClose }) {
  const result = useMonitoringStockDetail(context);
  const rows = result.data?.data || result.data?.racks || result.data?.distribution || [];
  const item = result.data?.item || context;
  const summary = result.data?.summary || {};

  return (
    <Drawer anchor="right" open={Boolean(context)} onClose={onClose} PaperProps={{ sx: { width: { xs: '100vw', md: 720 }, maxWidth: '100%', height: '100%' } }}>
      <Stack sx={{ height: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}><Stack><Typography variant="h5">Distribusi Rack</Typography><Typography variant="caption" color="text.secondary">Read-only current stock</Typography></Stack><IconButton aria-label="Tutup detail" onClick={onClose}><CloseIcon /></IconButton></Stack>
        <Divider />
        {result.refreshing ? <LinearProgress /> : null}
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          {result.loading ? <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ minHeight: 240 }}><CircularProgress /><Typography color="text.secondary">Memuat distribusi rack...</Typography></Stack> : null}
          {!result.loading && result.error ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => result.retry()}>Retry</Button>}>{errorMessage(result.error)}</Alert> : null}
          {!result.loading && !result.error ? <Stack spacing={2}>
            <Box><Typography variant="caption" color="primary" fontWeight={700}>{display(item?.item_code)}</Typography><Typography variant="h5">{display(item?.item_name)}</Typography><Typography variant="body2" color="text.secondary">{display(item?.part_number, 'Tanpa part number')} | {display(item?.warehouse_name || context?.warehouse_name)}</Typography></Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}><Typography variant="subtitle1">{Number(summary.total_racks ?? rows.length).toLocaleString('id-ID')} rack</Typography><Typography variant="subtitle1" fontWeight={700}>Total: {formatQuantity(summary.total_stock_order ?? summary.stock_order)} {display(item?.order_uom || context?.order_uom, '')}</Typography></Stack>
            <Box sx={{ overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 650 }}><TableHead><TableRow><TableCell>Business</TableCell><TableCell>Warehouse</TableCell><TableCell>Rack</TableCell><TableCell align="right">Order Stock</TableCell><TableCell align="right">Used Stock</TableCell><TableCell>Warning</TableCell></TableRow></TableHead><TableBody>
              {rows.map((row, index) => <TableRow key={row.rack_id ?? index} hover><TableCell>{display(row.business_code || row.business_name)}</TableCell><TableCell>{display(row.warehouse_code || row.warehouse_name)}</TableCell><TableCell><Typography variant="body2" fontWeight={700}>{display(row.rack_code)}</Typography><Typography variant="caption" color="text.secondary">{display(row.rack_name, '')}</Typography></TableCell><TableCell align="right">{formatQuantity(row.stock_order)} {display(row.order_uom || item?.order_uom, '')}</TableCell><TableCell align="right">{formatQuantity(row.stock_used)} {display(row.used_uom || item?.used_uom, '')}</TableCell><TableCell>{row.has_master_warning || row.has_conversion_warning || row.has_rack_warehouse_mismatch || Number(row.stock_order) < 0 ? 'Perlu diperiksa' : '-'}</TableCell></TableRow>)}
              {!rows.length ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Tidak ada distribusi rack.</TableCell></TableRow> : null}
            </TableBody></Table></Box>
          </Stack> : null}
        </Box>
      </Stack>
    </Drawer>
  );
}
