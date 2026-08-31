'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { usePartUsedHistoryDetail } from 'api/part-used-history';
import { formatDate, formatMoney, formatQuantity } from './list';

const errorMessage = (error) => error?.diagnostic?.message || error?.message || 'Gagal memuat detail transaksi.';
const value = (input, fallback = '-') => (input === undefined || input === null || input === '' ? fallback : input);

function Field({ label, children }) {
  return <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={600}>{value(children)}</Typography></Grid>;
}

export default function PartUsedHistoryDetail({ open, transactionId, onClose }) {
  const result = usePartUsedHistoryDetail(open, transactionId);
  const header = result.data?.header;
  const items = result.data?.items || [];
  const summary = result.data?.summary;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100vw', md: 760 }, maxWidth: '100%', height: '100%' } }}>
      <Stack sx={{ height: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Stack><Typography variant="h5">Detail Transaksi</Typography><Typography variant="caption" color="text.secondary">Read-only</Typography></Stack>
          <IconButton aria-label="Tutup detail" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        <Divider />
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          {result.loading ? <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240 }} spacing={1.5}><CircularProgress /><Typography color="text.secondary">Memuat detail transaksi...</Typography></Stack> : null}
          {!result.loading && result.error ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => result.retry()}>Retry</Button>}>{errorMessage(result.error)}</Alert> : null}
          {!result.loading && !result.error && header ? (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Field label="Kode Transaksi">{header.transaction_code}</Field>
                <Field label="Tanggal">{formatDate(header.transaction_date)}</Field>
                <Field label="Bisnis">{header.business_name}</Field>
                <Field label="Gudang">{header.warehouse_name}</Field>
                <Field label="Penerima">{header.receiver}</Field>
                <Field label="Delivery">{header.delivered_by}</Field>
                <Field label="Dibuat Pada">{header.created_at ? new Date(header.created_at).toLocaleString('id-ID') : '-'}</Field>
                <Grid item xs={12}><Typography variant="caption" color="text.secondary">Narasi</Typography><Typography variant="body2">{value(header.narrative)}</Typography></Grid>
              </Grid>
              <Divider />
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}>
                <Typography variant="subtitle1">Items ({Number(summary?.total_items ?? items.length).toLocaleString('id-ID')})</Typography>
                <Typography variant="subtitle1" fontWeight={700}>Total: {formatMoney(summary?.total_extended_price)}</Typography>
              </Stack>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1100 }}>
                  <TableHead><TableRow><TableCell>Barang</TableCell><TableCell align="right">Used Qty</TableCell><TableCell align="right">Unit Price</TableCell><TableCell align="right">Ext.Price</TableCell><TableCell>Unit ID</TableCell><TableCell align="right">HM/KM</TableCell><TableCell>Item Remark</TableCell></TableRow></TableHead>
                  <TableBody>
                    {items.map((item, index) => <TableRow key={item.item_id ?? index} hover><TableCell><Typography variant="body2" fontWeight={700}>{value(item.item_code)}</Typography><Typography variant="caption" color="text.secondary">{value(item.item_name)}{item.part_number ? ` | PN: ${item.part_number}` : ''}</Typography></TableCell><TableCell align="right">{formatQuantity(item.used_qty)} {value(item.used_uom, '')}</TableCell><TableCell align="right">{formatMoney(item.unit_price)}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoney(item.extended_price)}</TableCell><TableCell>{value(item.equipment_code, 'Tanpa Referensi')}</TableCell><TableCell align="right">{formatQuantity(item.smu)}</TableCell><TableCell>{value(item.item_remark)}</TableCell></TableRow>)}
                    {!items.length ? <TableRow><TableCell colSpan={7} align="center">Tidak ada item aktif.</TableCell></TableRow> : null}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          ) : null}
        </Box>
      </Stack>
    </Drawer>
  );
}
