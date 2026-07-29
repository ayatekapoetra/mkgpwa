'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import moment from 'moment';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DocumentDownload, DocumentUpload, InfoCircle, NoteText, Profile2User, Trash, Wallet3 } from 'iconsax-react';

import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import BtnBack from 'components/BtnBack';
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
  uploadPengajuanDanaAttachments,
  usePengajuanDanaAccess,
  usePengajuanDanaPermissions,
  useShowPengajuanDana,
  verifyPengajuanDana
} from 'api/pengajuan-dana';

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const statusMeta = {
  open: { label: 'Open', color: 'default' },
  approval: { label: 'Menunggu Approval', color: 'info' },
  verified: { label: 'Terverifikasi', color: 'success' },
  close: { label: 'Selesai', color: 'success' },
  reject: { label: 'Ditolak', color: 'error' }
};

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

function SectionCard({ title, subtitle, icon, children }) {
  const theme = useTheme();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main'
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box>
    </Paper>
  );
}

function DetailValue({ label, value, helper = '' }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1" fontWeight={650} sx={{ mt: 0.35, wordBreak: 'break-word' }}>{value || '-'}</Typography>
      {helper ? <Typography variant="caption" color="text.secondary">{helper}</Typography> : null}
    </Box>
  );
}

const getRecipientName = (item) => {
  if (item?.penerima === 'pemasok') return item.pemasok?.nama || item.nm_penerima || '-';
  if (item?.penerima === 'karyawan') return item.karyawan?.nama || item.nm_penerima || '-';
  return item?.nm_penerima || '-';
};

const isImageAttachment = (file) => ['png', 'jpg', 'jpeg', 'gif'].includes(String(file?.datatype || file?.url?.split('.').pop() || '').toLowerCase());

export default function PengajuanDanaDetailPage() {
  const theme = useTheme();
  const { id } = useParams();
  const router = useRouter();
  const { permissions: access, loading: accessLoading, error: accessError } = usePengajuanDanaAccess();
  const canRead = !accessLoading && !accessError && access.can_read;
  const { row, rowLoading, rowError, mutate } = useShowPengajuanDana(id, canRead);
  const { permissions, loading: permissionsLoading, error: permissionsError, mutate: mutatePermissions } = usePengajuanDanaPermissions(id, canRead);
  const [dialog, setDialog] = useState('');
  const [reason, setReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  const totals = useMemo(
    () => (row?.items || []).reduce(
      (result, item) => ({
        subtotal: result.subtotal + Number(item.total || 0),
        ppn: result.ppn + Number(item.ppn_rp || 0),
        grandtotal: result.grandtotal + Number(item.grandtotal || 0)
      }),
      { subtotal: 0, ppn: 0, grandtotal: 0 }
    ),
    [row?.items]
  );

  const currentStatus = statusMeta[row?.status] || { label: row?.status || '-', color: 'default' };
  const statusLabel = row?.status === 'open' && row?.last_action === 'returned' ? 'Open - Perlu Revisi' : currentStatus.label;

  const handleCloseDialog = () => {
    if (loadingAction) return;
    setDialog('');
    setReason('');
  };

  const handleAction = async () => {
    if (loadingAction) return;
    if (dialog === 'delete' && !permissions.can_remove) return;
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
    if (deletingItemId || !permissions.can_remove) return;

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

  const handleUploadAttachments = async (event) => {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (!files.length || uploadingAttachments || !permissions.can_upload_attachment) return;

    const invalidFile = files.find((file) => !['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      openNotification({
        open: true,
        title: 'error',
        message: `File ${invalidFile.name} harus berupa PNG, JPG, GIF, atau PDF dengan ukuran maksimal 10 MB`,
        alert: { color: 'error' }
      });
      return;
    }

    setUploadingAttachments(true);
    try {
      const result = await uploadPengajuanDanaAttachments(id, files);
      openNotification({
        open: true,
        title: 'success',
        message: result?.message || 'Nota tambahan berhasil diunggah',
        alert: { color: 'success' }
      });
      await Promise.all([mutate(), mutatePermissions()]);
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: error?.message || 'Gagal mengunggah nota tambahan',
        alert: { color: 'error' }
      });
    } finally {
      setUploadingAttachments(false);
    }
  };

  if (accessLoading || (canRead && (rowLoading || permissionsLoading))) {
    return <LoadingScreen fullScreen={false} message="Memuat detail pengajuan" />;
  }

  if (accessError) {
    return <ErrorScreen error={accessError} variant="data" showDetails={false} />;
  }

  if (!access.can_read) {
    return <ErrorScreen error={{ message: 'Anda tidak memiliki hak akses untuk melihat Pengajuan Dana.' }} variant="data" showDetails={false} />;
  }

  if (rowError || permissionsError) {
    return <ErrorScreen error={rowError || permissionsError} variant="data" showDetails={false} />;
  }

  if (!row) {
    return <ErrorScreen error={{ message: 'Data pengajuan tidak ditemukan' }} variant="data" showDetails={false} />;
  }

  return (
    <Fragment>
      <Breadcrumbs custom heading="Detail Pengajuan Dana" links={breadcrumbLinks} />
      <MainCard title={<BtnBack href="/pengajuan-dana" />} content>
        <Stack spacing={2.5}>
          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.background.paper, 1)} 65%)`,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.2)
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2.5}>
              <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
                <Typography variant="overline" color="primary.main">Pengajuan Dana</Typography>
                <Typography variant="h3">{row.kode || '-'}</Typography>
                <Typography variant="body1" color="text.secondary">{row.narasi || 'Tanpa narasi pengajuan.'}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={statusLabel} color={row.last_action === 'returned' ? 'warning' : currentStatus.color} />
                  <Chip label={`Revisi ${row.revision_no || 0}`} variant="outlined" />
                  <Chip label={`${(row.items || []).length} item`} variant="outlined" />
                  <Chip label={`${(row.files || []).length} lampiran`} variant="outlined" />
                </Stack>
              </Stack>
              <Box sx={{ minWidth: { md: 240 }, textAlign: { md: 'right' } }}>
                <Typography variant="caption" color="text.secondary">Total Pengajuan</Typography>
                <Typography variant="h3" color="primary.main" fontWeight={800}>{formatCurrency(row.total)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Transaksi {row.trx_date ? moment(row.trx_date).format('DD MMMM YYYY') : '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {row.returned_reason_last ? (
            <Alert severity="warning" icon={<InfoCircle size={18} />}>Alasan return terakhir: {row.returned_reason_last}</Alert>
          ) : null}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                lg: 'minmax(0, 17fr) minmax(280px, 7fr)'
              },
              gap: 2.5,
              alignItems: 'start',
              width: '100%'
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack spacing={2.5}>
                <SectionCard title="Informasi Dokumen" subtitle="Identitas, unit kerja, dan narasi pengajuan" icon={<NoteText size={20} />}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={6} md={4}><DetailValue label="Kode Dokumen" value={row.kode} /></Grid>
                    <Grid item xs={6} md={4}><DetailValue label="Tanggal Transaksi" value={row.trx_date ? moment(row.trx_date).format('DD MMMM YYYY') : '-'} /></Grid>
                    <Grid item xs={12} md={4}><DetailValue label="Status" value={statusLabel} /></Grid>
                    <Grid item xs={12} md={4}><DetailValue label="Bisnis Unit" value={row.bisnis?.name || row.bisnis?.initial} /></Grid>
                    <Grid item xs={12} md={4}><DetailValue label="Cabang" value={row.cabang?.nama || row.cabang?.initial} /></Grid>
                    <Grid item xs={12} md={4}><DetailValue label="Pembuat" value={row.creator?.nama_lengkap || row.creator?.username} /></Grid>
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.03) }}>
                        <DetailValue label="Narasi Pengajuan" value={row.narasi || 'Tanpa narasi.'} />
                      </Paper>
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard title="Rincian Item Pengajuan" subtitle="Akun, barang, penerima, pembayaran, dan komponen nilai per item" icon={<Wallet3 size={20} />}>
                  <Stack spacing={2}>
                    {(row.items || []).length === 0 ? <Alert severity="info">Belum ada item pengajuan.</Alert> : null}
                    {(row.items || []).map((item, index) => (
                      <Paper key={item.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ sm: 'center' }}
                          spacing={1.5}
                          sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                            <Chip size="small" color="primary" label={`Item ${index + 1}`} />
                            <Chip size="small" color={item.prioritas === 'P1' ? 'error' : item.prioritas === 'P2' ? 'warning' : 'default'} variant="outlined" label={item.prioritas || '-'} />
                            <Chip size="small" variant="outlined" label={(item.curr || 'IDR').toUpperCase()} />
                            <Chip size="small" variant="outlined" label={`${item.kategori || '-'} / ${item.metode || '-'}`} />
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h6" color="primary.main">{formatCurrency(item.grandtotal)}</Typography>
                            {row.status === 'open' && permissions.can_remove ? (
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={<Trash size={15} />}
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={Boolean(deletingItemId)}
                              >
                                {deletingItemId === item.id ? 'Menghapus...' : 'Hapus'}
                              </Button>
                            ) : null}
                          </Stack>
                        </Stack>

                        <Box sx={{ p: 2 }}>
                          <Grid container spacing={2.5}>
                            <Grid item xs={12} md={4}><DetailValue label="COA" value={item.coa?.kode} helper={item.coa?.coa_name || item.coa?.nama || ''} /></Grid>
                            <Grid item xs={12} md={4}><DetailValue label="Barang" value={item.barang?.nama || '-'} helper={item.barang?.kode || ''} /></Grid>
                            <Grid item xs={12} md={4}><DetailValue label="Gudang" value={item.gudang?.nama || '-'} helper={item.gudang?.kode || ''} /></Grid>
                            <Grid item xs={6} md={3}><DetailValue label="Qty / Satuan" value={`${Number(item.qty || 0).toLocaleString('id-ID')} ${item.satuan || ''}`} /></Grid>
                            <Grid item xs={6} md={3}><DetailValue label="Harga" value={item.curr === 'USD' ? `USD ${Number(item.harga_usd || 0).toLocaleString('id-ID')}` : formatCurrency(item.harga)} /></Grid>
                            <Grid item xs={6} md={3}><DetailValue label="Potongan" value={formatCurrency(item.potongan)} /></Grid>
                            <Grid item xs={6} md={3}><DetailValue label={`PPN ${Number(item.ppn || 0)}%`} value={formatCurrency(item.ppn_rp)} /></Grid>
                            <Grid item xs={12}><Divider /></Grid>
                            <Grid item xs={12} md={4}><DetailValue label="Jenis Penerima" value={item.penerima} helper={getRecipientName(item)} /></Grid>
                            <Grid item xs={12} md={4}><DetailValue label="Metode / Type Bayar" value={`${item.metode || '-'} / ${item.type_bayar || '-'}`} /></Grid>
                            <Grid item xs={12} md={4}><DetailValue label="Bank" value={item.nm_bank || '-'} helper={item.no_rekening ? `${item.no_rekening} · ${item.an_rekening || '-'}` : ''} /></Grid>
                            <Grid item xs={12}>
                              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.025) }}>
                                <DetailValue label="Narasi Item" value={item.narasi || '-'} />
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </SectionCard>

                <SectionCard title="Lampiran Pendukung" subtitle={`${(row.files || []).length} file terlampir pada dokumen`} icon={<DocumentDownload size={20} />}>
                  <Stack spacing={1.25}>
                    {permissions.can_upload_attachment && (
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.035) }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2">Tambah Nota Setelah Selesai</Typography>
                            <Typography variant="caption" color="text.secondary">PNG, JPG, GIF, atau PDF. Maksimal 10 MB per file.</Typography>
                          </Box>
                          <Button component="label" variant="contained" startIcon={<DocumentUpload size={18} />} disabled={uploadingAttachments}>
                            {uploadingAttachments ? 'Mengunggah...' : 'Upload Nota'}
                            <input hidden type="file" multiple accept="image/png,image/jpeg,image/gif,application/pdf" onChange={handleUploadAttachments} />
                          </Button>
                        </Stack>
                      </Paper>
                    )}
                    {(row.files || []).length === 0 ? <Typography variant="body2" color="text.secondary">Belum ada lampiran.</Typography> : null}
                    {(row.files || []).map((file) => (
                      <Stack key={file.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <Avatar
                            variant="rounded"
                            src={isImageAttachment(file) ? file.url : undefined}
                            alt={file.url?.split('/').pop() || `Lampiran ${file.id}`}
                            sx={{ width: 64, height: 64, bgcolor: 'action.hover', color: 'text.secondary', flexShrink: 0 }}
                          >
                            {!isImageAttachment(file) && <NoteText size={26} />}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{file.url?.split('/').pop() || `Lampiran ${file.id}`}</Typography>
                            <Typography variant="caption" color="text.secondary">Tipe: {file.datatype || '-'}</Typography>
                          </Box>
                        </Stack>
                        <Button component="a" href={file.url} target="_blank" rel="noreferrer" variant="outlined" size="small">Zoom</Button>
                      </Stack>
                    ))}
                  </Stack>
                </SectionCard>

                <SectionCard title="History Workflow" subtitle="Jejak perubahan status dan aktor dokumen" icon={<Profile2User size={20} />}>
                  <Stack spacing={1.5}>
                    {(row.histories || []).length === 0 ? <Typography variant="body2" color="text.secondary">Belum ada history workflow.</Typography> : null}
                    {(row.histories || []).map((history, index) => (
                      <Stack key={history.id} direction="row" spacing={1.5} alignItems="stretch">
                        <Stack alignItems="center">
                          <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: index === 0 ? 'primary.main' : 'grey.400', mt: 0.75 }} />
                          {index < row.histories.length - 1 ? <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 0.5 }} /> : null}
                        </Stack>
                        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, flex: 1, mb: 0.5 }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{history.action || '-'}</Typography>
                              <Typography variant="caption" color="text.secondary">{history.from_status || '-'} {'->'} {history.to_status || '-'}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">{history.created_at ? moment(history.created_at).format('DD MMM YYYY HH:mm') : '-'}</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 1 }}>Aktor: {history.actor?.nama_lengkap || history.actor_role || '-'}</Typography>
                          {history.reason ? <Alert severity="warning" sx={{ mt: 1, py: 0 }}>Alasan: {history.reason}</Alert> : null}
                          {history.notes ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>Catatan: {history.notes}</Typography> : null}
                        </Paper>
                      </Stack>
                    ))}
                  </Stack>
                </SectionCard>
              </Stack>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, background: `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${theme.palette.background.paper} 58%)` }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="overline" color="text.secondary">Ringkasan Pengajuan</Typography>
                      <Typography variant="h4" color="primary.main" fontWeight={800}>{formatCurrency(row.total)}</Typography>
                      <Typography variant="caption" color="text.secondary">Total final termasuk PPN</Typography>
                    </Box>
                    <Divider />
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Jumlah Item</Typography><Typography variant="subtitle2">{(row.items || []).length}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Subtotal</Typography><Typography variant="subtitle2">{formatCurrency(totals.subtotal)}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Total PPN</Typography><Typography variant="subtitle2">{formatCurrency(totals.ppn)}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Lampiran</Typography><Typography variant="subtitle2">{(row.files || []).length} file</Typography></Stack>
                    </Stack>
                    <Divider />
                    <Stack spacing={1}>
                      <Chip label={statusLabel} color={row.last_action === 'returned' ? 'warning' : currentStatus.color} />
                      <DetailValue label="Pembuat" value={row.creator?.nama_lengkap || row.creator?.username} />
                      <DetailValue label="Checker" value={row.checker?.nama_lengkap || row.checker?.username || '-'} />
                      <DetailValue label="Validator" value={row.validator?.nama_lengkap || row.validator?.username || '-'} />
                    </Stack>
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.25}>
                    <Typography variant="subtitle1" fontWeight={700}>Aksi Dokumen</Typography>
                    {row.status === 'open' && permissions.can_update && <Button component={Link} href={`/pengajuan-dana/${id}/edit`} variant="outlined">Edit Pengajuan</Button>}
                    {permissions.can_approve && <Button variant="contained" onClick={() => setDialog('approve')}>Approve</Button>}
                    {permissions.can_verify && <Button variant="contained" color="success" onClick={() => setDialog('verify')}>Verify</Button>}
                    {permissions.can_return && <Button variant="outlined" color="warning" onClick={() => setDialog('return')}>Return untuk Revisi</Button>}
                    {permissions.can_reject && <Button variant="outlined" color="error" onClick={() => setDialog('reject')}>Reject</Button>}
                    {row.status === 'open' && permissions.can_remove && <Button variant="outlined" color="error" onClick={() => setDialog('delete')}>Hapus Dokumen</Button>}
                    {!row.status || (!permissions.can_update && !permissions.can_remove && !permissions.can_upload_attachment && !permissions.can_approve && !permissions.can_verify && !permissions.can_return && !permissions.can_reject) ? (
                      <Alert severity="info" sx={{ mt: 0.5 }}>Tidak ada aksi yang tersedia untuk status dan hak akses Anda.</Alert>
                    ) : null}
                  </Stack>
                </Paper>
              </Stack>
            </Box>
          </Box>
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
