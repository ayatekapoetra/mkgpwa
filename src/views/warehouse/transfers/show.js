'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import AlertNotification from 'components/@extended/AlertNotification';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import { useShowWarehouseTransfer, useGetWarehouseTransferAudit } from 'api/warehouse-transfer';
import axiosServices from 'utils/axios';

moment.locale('id');

const statusColor = {
  draft: 'default',
  delivering: 'warning',
  partially_received: 'info',
  received: 'success',
  cancelled: 'error'
};

export default function WarehouseTransferShowScreen({ id }) {
  const router = useRouter();
  const { data, dataLoading, dataError, mutate } = useShowWarehouseTransfer(id);
  const { data: audits, dataLoading: auditLoading } = useGetWarehouseTransferAudit(id);

  const handleSubmitTransfer = async () => {
    try {
      const response = await axiosServices.post(`/warehouse/transfers/${id}/submit`, {}, { skipOfflineQueue: true });
      if (!response.data?.success) throw new Error(response.data?.message || 'Transfer gagal disubmit');
      openNotification({ open: true, title: 'success', message: response.data.message, alert: { color: 'success' } });
      await mutate();
    } catch (error) {
      openNotification({ open: true, title: 'error', message: error?.response?.data?.message || error?.message || 'Transfer gagal disubmit', alert: { color: 'error' } });
    }
  };

  const handleCancelTransfer = async () => {
    try {
      const response = await axiosServices.post(`/warehouse/transfers/${id}/cancel`, { reason: 'Cancelled from web-next' }, { skipOfflineQueue: true });
      if (!response.data?.success) throw new Error(response.data?.message || 'Transfer gagal dibatalkan');
      openNotification({ open: true, title: 'success', message: response.data.message, alert: { color: 'success' } });
      await mutate();
    } catch (error) {
      openNotification({ open: true, title: 'error', message: error?.response?.data?.message || error?.message || 'Transfer gagal dibatalkan', alert: { color: 'error' } });
    }
  };

  if (dataLoading) return <Stack sx={{ py: 8 }} alignItems="center"><CircularProgress size={28} /></Stack>;
  if (dataError || !data?.header) return <Alert severity="warning">Gagal memuat detail transfer.</Alert>;

  const { header, items, audit_summary: auditSummary } = data;
  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Warehouse Transfer', to: '/warehouse/transfers' },
    { title: header.kode || 'Detail', to: `/warehouse/transfers/${id}` }
  ];

  return (
    <Fragment>
      <Breadcrumbs custom heading={'Detail Warehouse Transfer'} links={breadcrumbLinks} />
      <MainCard
        title={<BtnBack href="/warehouse/transfers" />}
        secondary={
          <Stack direction="row" spacing={1}>
            {auditSummary?.can_edit ? <Button component={Link} href={`/warehouse/transfers/${id}/edit`} variant="outlined">Edit Draft</Button> : null}
            {auditSummary?.can_submit ? <Button variant="contained" onClick={handleSubmitTransfer}>Submit</Button> : null}
            {auditSummary?.can_receive ? <Button component={Link} href={`/warehouse/transfers/${id}/receive`} variant="contained" color="secondary">Terima Barang</Button> : null}
            {auditSummary?.can_cancel ? <Button variant="outlined" color="error" onClick={handleCancelTransfer}>Cancel</Button> : null}
          </Stack>
        }
      >
        <AlertNotification />
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Kode</Typography><Typography variant="subtitle1">{header.kode}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Tanggal</Typography><Typography variant="subtitle1">{header.trx_date ? moment(header.trx_date).format('DD-MM-YYYY') : '-'}</Typography></Grid>
          <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Status</Typography><Box><Chip size="small" label={String(header.status || '-').replaceAll('_', ' ')} color={statusColor[header.status] || 'default'} sx={{ textTransform: 'capitalize' }} /></Box></Grid>
          <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Source App</Typography><Typography variant="subtitle1">{header.source_app || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="caption" color="text.secondary">Gudang Sumber</Typography><Typography variant="subtitle1">{header.gudang_src ? `${header.gudang_src.kode} - ${header.gudang_src.nama}` : '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="caption" color="text.secondary">Gudang Tujuan</Typography><Typography variant="subtitle1">{header.gudang_target ? `${header.gudang_target.kode} - ${header.gudang_target.nama}` : '-'}</Typography></Grid>
          <Grid item xs={12}><Typography variant="caption" color="text.secondary">Narasi</Typography><Typography variant="body2">{header.narasi || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="caption" color="text.secondary">Shipping Order</Typography><Typography variant="subtitle1">{header.shipping_order?.kode || '-'}</Typography></Grid>
          <Grid item xs={12} md={6}><Typography variant="caption" color="text.secondary">Surat Jalan</Typography><Typography variant="subtitle1">{header.surat_jalan?.kode || '-'}</Typography></Grid>

          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }}>Items</Divider>
            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 999 }
              }}
            >
              <Table
                sx={{
                  minWidth: 1100,
                  tableLayout: 'auto',
                  '& .MuiTableCell-root': { whiteSpace: 'nowrap', verticalAlign: 'top' }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Barang</TableCell>
                    <TableCell>Rack Sumber</TableCell>
                    <TableCell align="right">Qty Pakai</TableCell>
                    <TableCell align="right">Qty Order</TableCell>
                    <TableCell align="right">Received Pakai</TableCell>
                    <TableCell align="right">Received Order</TableCell>
                    <TableCell align="right">Remaining Pakai</TableCell>
                    <TableCell align="right">Remaining Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{item.barang?.kode || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.barang?.nama || '-'}</Typography>
                      </TableCell>
                      <TableCell>{item.rack_src ? `${item.rack_src.kode} - ${item.rack_src.nama}` : '-'}</TableCell>
                      <TableCell align="right">{item.qty_pakai} {item.satuan_pakai}</TableCell>
                      <TableCell align="right">{item.qty_order} {item.satuan_order}</TableCell>
                      <TableCell align="right">{item.qty_received_pakai} {item.satuan_pakai}</TableCell>
                      <TableCell align="right">{item.qty_received_order} {item.satuan_order}</TableCell>
                      <TableCell align="right">{item.qty_remaining_pakai} {item.satuan_pakai}</TableCell>
                      <TableCell align="right">{item.qty_remaining_order} {item.satuan_order}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }}>Audit Timeline</Divider>
            {auditLoading ? <CircularProgress size={20} /> : (
              <Stack spacing={1.5}>
                {audits.map((audit) => (
                  <Box key={audit.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={700}>{audit.event_label}</Typography>
                    <Typography variant="caption" color="text.secondary">{audit.created_at ? moment(audit.created_at).format('DD-MM-YYYY HH:mm') : '-'} | {audit.created_by?.nama || '-'}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>
      </MainCard>
    </Fragment>
  );
}
