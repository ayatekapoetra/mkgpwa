'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import moment from 'moment';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
import ScrollX from 'components/ScrollX';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  approvePengajuanDana,
  deletePengajuanDana,
  deletePengajuanDanaItem,
  rejectPengajuanDana,
  returnPengajuanDana,
  usePengajuanDanaPermissions,
  useShowPengajuanDana,
  verifyPengajuanDana
} from 'api/pengajuan-dana';

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Pengajuan Dana', to: '/pengajuan-dana' },
  { title: 'Detail' }
];

function ActionDialog({ open, title, message, requireReason = false, loading = false, reason, onReasonChange, onClose, onSubmit, submitLabel }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2">{message}</Typography>
          {requireReason && (
            <TextField
              label="Alasan"
              multiline
              minRows={4}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              fullWidth
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant="contained" color="primary" onClick={onSubmit} disabled={loading}>
          {loading ? 'Memproses...' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PengajuanDanaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { row, rowLoading, rowError, mutate } = useShowPengajuanDana(id);
  const { permissions, mutate: mutatePermissions } = usePengajuanDanaPermissions(id);
  const [dialog, setDialog] = useState('');
  const [reason, setReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  const summaryRows = useMemo(
    () => [
      { label: 'Kode', value: row?.kode || '-' },
      { label: 'Tanggal', value: row?.trx_date ? moment(row.trx_date).format('DD MMMM YYYY') : '-' },
      { label: 'Bisnis', value: row?.bisnis?.name || row?.bisnis?.initial || '-' },
      { label: 'Cabang', value: row?.cabang?.nama || row?.cabang?.initial || '-' },
      { label: 'Pembuat', value: row?.creator?.nama_lengkap || '-' },
      { label: 'Total', value: formatCurrency(row?.total) }
    ],
    [row]
  );

  const handleCloseDialog = () => {
    if (loadingAction) return;
    setDialog('');
    setReason('');
  };

  const handleAction = async () => {
    if (loadingAction) return;
    if (['reject', 'return'].includes(dialog) && !reason.trim()) {
      openNotification({ open: true, title: 'error', message: 'Alasan wajib diisi', alert: { color: 'error' } });
      return;
    }

    setLoadingAction(true);
    try {
      if (dialog === 'approve') await approvePengajuanDana(id, {});
      if (dialog === 'reject') await rejectPengajuanDana(id, { reason: reason.trim() });
      if (dialog === 'return') await returnPengajuanDana(id, { reason: reason.trim() });
      if (dialog === 'verify') await verifyPengajuanDana(id, {});
      if (dialog === 'delete') {
        await deletePengajuanDana(id);
        openNotification({ open: true, title: 'success', message: 'Pengajuan berhasil dihapus', alert: { color: 'success' } });
        router.push('/pengajuan-dana');
        return;
      }

      openNotification({ open: true, title: 'success', message: 'Aksi berhasil diproses', alert: { color: 'success' } });
      handleCloseDialog();
      await Promise.all([mutate(), mutatePermissions()]);
    } catch (error) {
      openNotification({ open: true, title: 'error', message: error?.message || 'Gagal memproses aksi', alert: { color: 'error' } });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (deletingItemId) return;

    setDeletingItemId(itemId);
    try {
      await deletePengajuanDanaItem(id, itemId);
      openNotification({ open: true, title: 'success', message: 'Item pengajuan berhasil dihapus', alert: { color: 'success' } });
      await Promise.all([mutate(), mutatePermissions()]);
    } catch (error) {
      openNotification({ open: true, title: 'error', message: error?.message || 'Gagal menghapus item pengajuan', alert: { color: 'error' } });
    } finally {
      setDeletingItemId(null);
    }
  };

  if (rowLoading) {
    return <LoadingScreen fullScreen={false} message="Memuat detail pengajuan" />;
  }

  if (rowError) {
    return <ErrorScreen error={rowError} variant="data" showDetails={false} />;
  }

  if (!row) {
    return <ErrorScreen error={{ message: 'Data pengajuan tidak ditemukan' }} variant="data" showDetails={false} />;
  }

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Pengajuan Dana" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/pengajuan-dana" />} content>
        <Stack spacing={3}>
          <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: 'secondary.200', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">Pengajuan Dana</Typography>
                <Typography variant="h3">{row.kode}</Typography>
                <Typography variant="body1" color="text.secondary">{row.narasi || 'Tanpa narasi.'}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={row.status === 'open' && row.last_action === 'returned' ? 'Open - Perlu Revisi' : row.status} color={row.status === 'reject' ? 'error' : row.status === 'close' ? 'success' : row.status === 'approval' ? 'info' : row.last_action === 'returned' ? 'warning' : 'default'} />
                  <Chip label={`Revisi ${row.revision_no || 0}`} variant="outlined" />
                </Stack>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.5}>
                {row.status === 'open' && <Button component={Link} href={`/pengajuan-dana/${id}/edit`} variant="outlined">Edit</Button>}
                {permissions.can_approve && <Button variant="contained" onClick={() => setDialog('approve')}>Approve</Button>}
                {permissions.can_verify && <Button variant="contained" color="success" onClick={() => setDialog('verify')}>Verify</Button>}
                {permissions.can_return && <Button variant="outlined" color="warning" onClick={() => setDialog('return')}>Return</Button>}
                {permissions.can_reject && <Button variant="outlined" color="error" onClick={() => setDialog('reject')}>Reject</Button>}
                {row.status === 'open' && <Button variant="outlined" color="error" onClick={() => setDialog('delete')}>Delete</Button>}
              </Stack>
            </Stack>
          </Box>

          {row.returned_reason_last && (
            <Alert severity="warning">Alasan return terakhir: {row.returned_reason_last}</Alert>
          )}

          <Grid container spacing={2.5}>
            {summaryRows.map((item) => (
              <Grid item xs={12} md={4} key={item.label}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{item.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <MainCard content={false} title={<Typography>Item Pengajuan</Typography>}>
            <ScrollX>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>COA</TableCell>
                    <TableCell>Narasi</TableCell>
                    <TableCell>Penerima</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Grand Total</TableCell>
                    {row.status === 'open' && <TableCell align="center">Aksi</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(row.items || []).map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={700}>{item.coa?.kode || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.coa?.nama || '-'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{item.narasi || '-'}</TableCell>
                      <TableCell>{item.penerima || '-'}</TableCell>
                      <TableCell align="right">{Number(item.qty || 0).toLocaleString('id-ID')} {item.satuan || ''}</TableCell>
                      <TableCell align="right">{formatCurrency(item.grandtotal)}</TableCell>
                      {row.status === 'open' && (
                        <TableCell align="center">
                          <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteItem(item.id)} disabled={Boolean(deletingItemId)}>
                            {deletingItemId === item.id ? 'Menghapus...' : 'Hapus'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollX>
          </MainCard>

          <MainCard content={false} title={<Typography>Lampiran</Typography>}>
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
              {(row.files || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">Belum ada lampiran.</Typography>
              ) : (
                row.files.map((file) => (
                  <Stack key={file.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{file.url?.split('/').pop() || `Lampiran ${file.id}`}</Typography>
                      <Typography variant="caption" color="text.secondary">.{file.datatype || '-'}</Typography>
                    </Box>
                    <Button component="a" href={file.url} target="_blank" rel="noreferrer" variant="outlined" size="small">Lihat</Button>
                  </Stack>
                ))
              )}
            </Stack>
          </MainCard>

          <MainCard content={false} title={<Typography>History Workflow</Typography>}>
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
              {(row.histories || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">Belum ada history workflow.</Typography>
              ) : (
                row.histories.map((history) => (
                  <Box key={history.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{history.action || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {history.from_status || '-'} {'->'} {history.to_status || '-'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {history.created_at ? moment(history.created_at).format('DD MMM YYYY HH:mm') : '-'}
                      </Typography>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="body2">Aktor: {history.actor?.nama_lengkap || history.actor_role || '-'}</Typography>
                    {history.reason && <Typography variant="body2">Reason: {history.reason}</Typography>}
                    {history.notes && <Typography variant="body2">Notes: {history.notes}</Typography>}
                  </Box>
                ))
              )}
            </Stack>
          </MainCard>
        </Stack>

        <ActionDialog
          open={dialog === 'approve'}
          title="Approve Pengajuan"
          message="Pengajuan akan dipindahkan ke status approval untuk diproses finance."
          loading={loadingAction}
          reason={reason}
          onReasonChange={setReason}
          onClose={handleCloseDialog}
          onSubmit={handleAction}
          submitLabel="Approve"
        />

        <ActionDialog
          open={dialog === 'verify'}
          title="Verify Pengajuan"
          message="Verifikasi akan menutup pengajuan dan dapat membentuk dokumen faktur, pembayaran, dan logistik. Pastikan data sudah final."
          loading={loadingAction}
          reason={reason}
          onReasonChange={setReason}
          onClose={handleCloseDialog}
          onSubmit={handleAction}
          submitLabel="Verify"
        />

        <ActionDialog
          open={dialog === 'reject'}
          title="Reject Pengajuan"
          message="Reject bersifat final. Dokumen akan masuk status reject dan tidak kembali ke alur revisi normal."
          requireReason
          loading={loadingAction}
          reason={reason}
          onReasonChange={setReason}
          onClose={handleCloseDialog}
          onSubmit={handleAction}
          submitLabel="Reject"
        />

        <ActionDialog
          open={dialog === 'return'}
          title="Return untuk Revisi"
          message="Dokumen akan dikembalikan ke status open agar pembuat memperbaiki data. Setelah revisi, dokumen wajib melewati approval ulang."
          requireReason
          loading={loadingAction}
          reason={reason}
          onReasonChange={setReason}
          onClose={handleCloseDialog}
          onSubmit={handleAction}
          submitLabel="Return"
        />

        <ActionDialog
          open={dialog === 'delete'}
          title="Hapus Pengajuan"
          message="Dokumen akan dinonaktifkan dari daftar aktif. Gunakan hanya jika pengajuan memang harus dibatalkan."
          loading={loadingAction}
          reason={reason}
          onReasonChange={setReason}
          onClose={handleCloseDialog}
          onSubmit={handleAction}
          submitLabel="Hapus"
        />
      </MainCard>
    </Fragment>
  );
}
