'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { useSnackbar } from 'notistack';

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
import { useShowGoodsIssue, useGetGoodsIssueAudit, postGoodsIssue, voidGoodsIssue, reviseGoodsIssue, downloadGoodsIssuePdf } from 'api/goods-issue';
import ActionDialog from 'views/scm/purchasing-request/components/ActionDialog';

import { DocumentDownload } from 'iconsax-react';

moment.locale('id');

const statusConfig = {
  DRAFT: { color: 'default', label: 'Draft' },
  POSTED: { color: 'success', label: 'Posted' },
  VOIDED: { color: 'error', label: 'Voided' }
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const auditEventLabels = {
  CREATED: 'Dokumen Dibuat',
  UPDATED: 'Draft Diperbarui',
  POSTED: 'Dokumen Diposting',
  VOIDED: 'Dokumen Dibatalkan',
  REPLACEMENT_CREATED: 'Replacement Dibuat'
};

export default function GoodsIssueShowScreen({ id }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { data, dataLoading, dataError, mutate } = useShowGoodsIssue(id);
  const { data: audits, dataLoading: auditLoading } = useGetGoodsIssueAudit(id);

  const [actionLoading, setActionLoading] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [reviseDialogOpen, setReviseDialogOpen] = useState(false);
  const [reviseReason, setReviseReason] = useState('');

  const handlePost = async () => {
    try {
      setActionLoading(true);
      const response = await postGoodsIssue(id, { version: data?.header?.version });
      if (!response?.success) throw new Error(response?.message || 'Posting gagal');
      openNotification({ open: true, title: 'success', message: response.message || 'Goods Issue berhasil diposting', alert: { color: 'success' } });
      router.push('/goods-issues');
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Posting gagal',
        alert: { color: 'error' }
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    try {
      setActionLoading(true);
      const response = await voidGoodsIssue(id, { reason: voidReason, version: data?.header?.version });
      if (!response?.success) throw new Error(response?.message || 'Void gagal');
      openNotification({ open: true, title: 'success', message: response.message || 'Goods Issue berhasil dibatalkan', alert: { color: 'success' } });
      setVoidDialogOpen(false);
      setVoidReason('');
      await mutate();
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Void gagal',
        alert: { color: 'error' }
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevise = async () => {
    try {
      setActionLoading(true);
      const response = await reviseGoodsIssue(id, { reason: reviseReason });
      if (!response?.success) throw new Error(response?.message || 'Revise gagal');
      openNotification({ open: true, title: 'success', message: 'Reversal dan replacement draft berhasil dibuat', alert: { color: 'success' } });
      setReviseDialogOpen(false);
      setReviseReason('');
      const replacementId = response.data?.replacement_draft_id;
      router.push(`/goods-issues/${replacementId}/edit`);
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.response?.data?.message || error?.message || 'Revise gagal',
        alert: { color: 'error' }
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setActionLoading(true);
      const { blob, filename } = await downloadGoodsIssuePdf(id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('PDF berhasil diunduh', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || 'Gagal mengunduh PDF', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <Stack sx={{ py: 8 }} alignItems="center">
        <CircularProgress size={28} />
      </Stack>
    );
  }
  if (dataError || !data?.header) return <Alert severity="warning">Gagal memuat detail Goods Issue.</Alert>;

  const { header, items, permissions: docPermissions } = data;
  const status = statusConfig[header.status] || statusConfig.DRAFT;
  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Goods Issues', to: '/goods-issues' },
    { title: header.kode || 'Detail', to: `/goods-issues/${id}` }
  ];

  const canUpdate = docPermissions?.can_update ?? false;
  const canPost = docPermissions?.can_post ?? false;
  const canVoid = docPermissions?.can_void ?? false;
  const canRevise = docPermissions?.can_revise ?? false;
  const totalValue = (items || []).reduce((sum, item) => sum + Number(item.extended_price || item.totharga_used || 0), 0);

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Goods Issue" links={breadcrumbLinks} />
      <MainCard
        title={<BtnBack href="/goods-issues" />}
        secondary={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {canUpdate && header.status === 'DRAFT' ? (
              <Button component={Link} href={`/goods-issues/${id}/edit`} variant="outlined">
                Edit Draft
              </Button>
            ) : null}
            {canPost && header.status === 'DRAFT' ? (
              <Button variant="contained" color="success" onClick={handlePost} disabled={actionLoading}>
                {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Post'}
              </Button>
            ) : null}
            {canVoid && (header.status === 'DRAFT' || header.status === 'POSTED') ? (
              <Button variant="outlined" color="error" onClick={() => setVoidDialogOpen(true)} disabled={actionLoading}>
                {header.status === 'DRAFT' ? 'Cancel Draft' : 'Void'}
              </Button>
            ) : null}
            {canRevise && header.status === 'POSTED' ? (
              <Button variant="contained" color="warning" onClick={() => setReviseDialogOpen(true)} disabled={actionLoading}>
                Revise
              </Button>
            ) : null}
            {header.status === 'POSTED' || header.status === 'VOIDED' ? (
              <Button variant="outlined" startIcon={<DocumentDownload size={20} />} onClick={handleDownloadPdf} disabled={actionLoading}>
                PDF
              </Button>
            ) : null}
          </Stack>
        }
      >
        <AlertNotification />
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">
              Kode
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {header.kode}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">
              Tanggal
            </Typography>
            <Typography variant="subtitle1">{header.trx_date ? moment(header.trx_date).format('DD-MM-YYYY') : '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Box>
              <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 600 }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">
              Source
            </Typography>
            <Typography variant="subtitle1">{header.source_type || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">
              Bisnis
            </Typography>
            <Typography variant="subtitle1">{header.bisnis_name || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">
              Gudang
            </Typography>
            <Typography variant="subtitle1">
              {header.gudang_code ? `${header.gudang_code} - ${header.gudang_name || ''}` : header.gudang_name || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">
              Penerima
            </Typography>
            <Typography variant="subtitle1">{header.penerima || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              Narasi
            </Typography>
            <Typography variant="body2">{header.narasi || '-'}</Typography>
          </Grid>

          {header.replacement_of_id ? (
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Replacement Of
              </Typography>
              <Button component={Link} href={`/goods-issues/${header.replacement_of_id}`} size="small">
                {header.replacement_of_code || `#${header.replacement_of_id}`}
              </Button>
            </Grid>
          ) : null}
          {header.replaced_by_id ? (
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Replaced By
              </Typography>
              <Button component={Link} href={`/goods-issues/${header.replaced_by_id}`} size="small">
                {header.replaced_by_code || `#${header.replaced_by_id}`}
              </Button>
            </Grid>
          ) : null}
          {header.source_type === 'MATERIAL_REQUEST' && header.source_id ? (
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Material Request
              </Typography>
              <Typography variant="subtitle1">#{header.source_id}</Typography>
            </Grid>
          ) : null}

          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }}>Items ({(items || []).length})</Divider>
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
                  minWidth: 1200,
                  tableLayout: 'auto',
                  '& .MuiTableCell-root': { whiteSpace: 'nowrap', verticalAlign: 'top' }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Barang</TableCell>
                    <TableCell>Rack</TableCell>
                    <TableCell align="right">Qty Pakai</TableCell>
                    <TableCell align="right">Qty Base</TableCell>
                    <TableCell align="right">Harga Pakai</TableCell>
                    <TableCell align="right">Ext. Price</TableCell>
                    <TableCell>Equipment</TableCell>
                    <TableCell align="right">HM/KM</TableCell>
                    <TableCell>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(items || []).map((item, index) => (
                    <TableRow key={item.id || index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {item.item_code || item.barang?.kode || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.item_name || item.barang?.nama || '-'}
                        </Typography>
                        {item.part_number ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            PN: {item.part_number}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{item.rack_code || item.rack?.kode || '-'}</TableCell>
                      <TableCell align="right">
                        {item.qty_pakai || item.qty || 0} {item.usage_uom || item.satuan || ''}
                      </TableCell>
                      <TableCell align="right">
                        {item.qty_base || item.qty_order || 0} {item.base_uom || item.stn_order || ''}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.unit_price || item.harga_used)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(item.extended_price || item.totharga_used)}
                      </TableCell>
                      <TableCell>{item.equipment_code || item.equipment?.kode || 'Tanpa Referensi'}</TableCell>
                      <TableCell align="right">{item.smu || '-'}</TableCell>
                      <TableCell>{item.remark || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Total: {formatCurrency(totalValue)}
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }}>Audit Timeline</Divider>
            {auditLoading ? (
              <CircularProgress size={20} />
            ) : (audits || []).length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                Tidak ada audit record.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {(audits || []).map((audit) => (
                  <Box key={audit.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {audit.event_label || auditEventLabels[audit.event] || audit.event}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {audit.created_at ? moment(audit.created_at).format('DD-MM-YYYY HH:mm') : '-'} | {audit.created_by?.nama || audit.created_by_name || '-'}
                    </Typography>
                    {audit.reason ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Alasan: {audit.reason}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>
      </MainCard>

      <ActionDialog
        open={voidDialogOpen}
        title={header.status === 'DRAFT' ? 'Cancel Draft' : 'Void Posted Document'}
        description={
          header.status === 'DRAFT'
            ? 'Draft akan dibatalkan tanpa reversal stok.'
            : 'Posted document akan di-reverse. Stok akan dikembalikan ke rack asal.'
        }
        confirmLabel="Konfirmasi"
        color="error"
        loading={actionLoading}
        reason={voidReason}
        onReasonChange={setVoidReason}
        requireReason={header.status === 'POSTED'}
        onClose={() => setVoidDialogOpen(false)}
        onConfirm={handleVoid}
      />

      <ActionDialog
        open={reviseDialogOpen}
        title="Revise Posted Document"
        description="Dokumen akan di-void dengan reversal stok, dan replacement draft akan dibuat untuk dikoreksi."
        confirmLabel="Revise"
        color="warning"
        loading={actionLoading}
        reason={reviseReason}
        onReasonChange={setReviseReason}
        requireReason
        onClose={() => setReviseDialogOpen(false)}
        onConfirm={handleRevise}
      />
    </Fragment>
  );
}