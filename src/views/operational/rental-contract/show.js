'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  Calendar,
  Clock,
  DocumentText,
  Edit2,
  InfoCircle,
  Money,
  ReceiptItem,
  Setting2,
  TickCircle,
  Truck,
  Warning2
} from 'iconsax-react';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { openNotification } from 'api/notification';
import {
  approveRentalContract,
  cancelRentalContract,
  getErrorMessage,
  rejectRentalContract,
  requestRentalContractApproval,
  statusColor,
  statusLabel,
  useRentalContract,
  useRentalContractAudits
} from 'api/rental-contract';

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};

const formatPrice = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
};

const billingLabels = { HOUR: 'Per jam', DAY: 'Per hari', MONTH: 'Per bulan' };
const minimumLabels = { DAY: 'Per hari', CALENDAR_MONTH: 'Per bulan kalender', RENTAL_TERM: 'Seluruh masa sewa' };
const roleLabels = { MAIN: 'Main', BACKUP: 'Backup' };
const roleColors = { MAIN: 'primary', BACKUP: 'warning' };

const groupKeyOf = (item) => [
  item.effective_from || '', item.effective_to || '', item.billing_unit || '',
  String(item.unit_price ?? ''), String(item.minimum_quantity ?? '0'),
  item.minimum_period || '', item.notes || '', item.role || 'MAIN'
].join('|');

const groupItems = (items = []) => {
  const groups = [];
  items.forEach((item) => {
    const key = groupKeyOf(item);
    const existing = groups.find((g) => g._key === key);
    if (existing) existing.items.push(item);
    else groups.push({
      _key: key, items: [item], role: item.role || 'MAIN',
      effective_from: item.effective_from, effective_to: item.effective_to,
      billing_unit: item.billing_unit, unit_price: item.unit_price,
      minimum_quantity: item.minimum_quantity, minimum_period: item.minimum_period, notes: item.notes
    });
  });
  return groups;
};

function StatCard({ label, value, helper, icon: Icon, color = 'primary' }) {
  return <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2, borderColor: `${color}.main`, borderWidth: 1, borderTopWidth: 3 }}>
    <Stack direction="row" justifyContent="space-between" spacing={1}>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
        {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
      </Box>
      <Box sx={{ width: 38, height: 38, borderRadius: 1.5, display: 'grid', placeItems: 'center', color: `${color}.main`, bgcolor: `${color}.lighter` }}><Icon size={20} /></Box>
    </Stack>
  </Paper>;
}

function EquipmentTable({ items }) {
  return <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: 'primary.lighter' }}>
          <TableCell sx={{ fontWeight: 800, color: 'primary.main', width: 40 }}>No</TableCell>
          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Kode</TableCell>
          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Model</TableCell>
          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Manufaktur</TableCell>
          <TableCell sx={{ fontWeight: 800, color: 'primary.main', width: 100 }}>Tahun</TableCell>
          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Identitas</TableCell>
          <TableCell sx={{ fontWeight: 800, color: 'primary.main', width: 80 }}>Role</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item, idx) => {
          const eq = item.equipment || {};
          return <TableRow key={item.id || idx} hover sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell><Typography variant="caption" fontWeight={700}>{idx + 1}</Typography></TableCell>
            <TableCell><Typography variant="body2" fontWeight={800} color="primary.main">{eq.kode || item.kdunit || '-'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{eq.model || '-'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{eq.manufaktur || '-'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{eq.tahun || '-'}</Typography></TableCell>
            <TableCell><Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>{eq.identity || '-'}</Typography></TableCell>
            <TableCell><Chip size="small" label={roleLabels[item.role] || 'Main'} color={roleColors[item.role] || 'primary'} sx={{ fontWeight: 700, height: 22 }} /></TableCell>
          </TableRow>;
        })}
      </TableBody>
    </Table>
  </TableContainer>;
}

function TariffGroupCard({ group, index }) {
  const isBackup = group.role === 'BACKUP';
  const accentColor = isBackup ? 'warning' : 'primary';
  const mainCount = group.items.filter((i) => (i.role || 'MAIN') === 'MAIN').length;
  const backupCount = group.items.length - mainCount;

  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, borderTop: 3, borderTopColor: `${accentColor}.main` }}>
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${accentColor}.lighter`, color: `${accentColor}.main`, display: 'grid', placeItems: 'center', fontWeight: 800 }}>
            {String(index + 1).padStart(2, '0')}
          </Box>
          <Box>
            <Typography variant="h6">Grup Tarif {index + 1}</Typography>
            <Typography variant="caption" color="text.secondary">{group.items.length} equipment · {mainCount} main · {backupCount} backup</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.75}>
          <Chip size="small" color={accentColor} variant="outlined" label={billingLabels[group.billing_unit] || group.billing_unit} />
          <Chip size="small" color={isBackup ? 'warning' : 'primary'} label={isBackup ? 'Backup' : 'Main'} sx={{ fontWeight: 700 }} />
        </Stack>
      </Stack>

      <EquipmentTable items={group.items} />

      <Divider />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" spacing={1} alignItems="center"><Calendar size={18} color="#697586" /><Box><Typography variant="caption" color="text.secondary">Periode</Typography><Typography variant="body2" fontWeight={700}>{formatDate(group.effective_from)} - {formatDate(group.effective_to)}</Typography></Box></Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" spacing={1} alignItems="center"><Money size={18} color="#697586" /><Box><Typography variant="caption" color="text.secondary">Harga satuan</Typography><Typography variant="body2" fontWeight={700}>{formatPrice(group.unit_price)}</Typography></Box></Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" spacing={1} alignItems="center"><Setting2 size={18} color="#697586" /><Box><Typography variant="caption" color="text.secondary">Minimum</Typography><Typography variant="body2" fontWeight={700}>{group.minimum_quantity ?? 0} · {minimumLabels[group.minimum_period] || '-'}</Typography></Box></Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" spacing={1} alignItems="center"><ReceiptItem size={18} color="#697586" /><Box><Typography variant="caption" color="text.secondary">Skema</Typography><Typography variant="body2" fontWeight={700}>{billingLabels[group.billing_unit] || '-'}</Typography></Box></Stack>
        </Grid>
      </Grid>
      {group.notes && <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ bgcolor: 'background.neutral', p: 1.5, borderRadius: 1.5 }}><DocumentText size={16} color="#697586" /><Typography variant="body2" color="text.secondary">{group.notes}</Typography></Stack>}
    </Stack>
  </Paper>;
}

function LoadingState() {
  return <Stack spacing={2}><Skeleton variant="rounded" height={170} /><Grid container spacing={2}>{[1, 2, 3].map((i) => <Grid item xs={12} md={4} key={i}><Skeleton variant="rounded" height={110} /></Grid>)}</Grid><Skeleton variant="rounded" height={300} /></Stack>;
}

export default function RentalContractShow({ id }) {
  const { data, loading, error, mutate } = useRentalContract(id);
  const { data: audits, loading: auditsLoading, error: auditsError } = useRentalContractAudits(id);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [processingAction, setProcessingAction] = useState('');
  const [statusOverride, setStatusOverride] = useState('');

  if (loading) return <><Breadcrumbs custom heading="Detail Kontrak Rental" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Kontrak Tarif Rental', to: '/rental-contracts' }, { title: 'Detail' }]} /><LoadingState /></>;
  if (error || !data) return <><Breadcrumbs custom heading="Detail Kontrak Rental" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Kontrak Tarif Rental', to: '/rental-contracts' }, { title: 'Detail' }]} /><Alert severity="error" action={<Button color="inherit" size="small" onClick={() => mutate()}>Coba lagi</Button>}>Gagal memuat detail kontrak rental.</Alert></>;

  const header = data.header || data;
  const permissions = data.permissions || {};
  const items = data.items || header.items || [];
  const status = statusOverride || header.status;
  const groups = groupItems(items);
  const mainCount = items.filter((i) => (i.role || 'MAIN') === 'MAIN').length;
  const backupCount = items.length - mainCount;

  const run = async (name) => {
    const statusByAction = { 'request-approval': 'PENDING_APPROVAL', approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED' };
    setProcessingAction(name);
    try {
      let response;
      if (name === 'request-approval') response = await requestRentalContractApproval(id);
      if (name === 'approve') response = await approveRentalContract(id);
      if (name === 'reject') response = await rejectRentalContract(id, reason.trim());
      if (name === 'cancel') response = await cancelRentalContract(id, reason.trim());
      setStatusOverride(response?.status || statusByAction[name]);
      openNotification({ title: 'success', message: 'Aksi kontrak berhasil diproses', alert: { color: 'success' } });
      setAction(''); setReason(''); await mutate();
    } catch (err) {
      openNotification({ title: 'error', message: getErrorMessage(err), alert: { color: 'error' } });
    } finally {
      setProcessingAction('');
    }
  };
  const needsReason = action === 'reject' || action === 'cancel';
  const actionLabels = { 'request-approval': 'Mengajukan...', approve: 'Menyetujui...', reject: 'Menolak...', cancel: 'Membatalkan...' };
  const actionButtons = <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
    {permissions.can_update && ['DRAFT', 'REJECTED'].includes(status) && <Button component={Link} href={`/rental-contracts/${id}/edit`} startIcon={<Edit2 size={17} />} variant="outlined" disabled={Boolean(processingAction)}>Edit</Button>}
    {(permissions.can_validate || permissions.can_request_approval) && status === 'DRAFT' && <Button variant="contained" onClick={() => run('request-approval')} disabled={Boolean(processingAction)}>{processingAction === 'request-approval' ? actionLabels['request-approval'] : 'Ajukan approval'}</Button>}
    {permissions.can_approve && status === 'PENDING_APPROVAL' && <Button color="success" variant="contained" startIcon={<TickCircle size={17} />} onClick={() => run('approve')} disabled={Boolean(processingAction)}>{processingAction === 'approve' ? actionLabels.approve : 'Setujui'}</Button>}
    {permissions.can_reject && status === 'PENDING_APPROVAL' && <Button color="error" onClick={() => setAction('reject')} disabled={Boolean(processingAction)}>{processingAction === 'reject' ? actionLabels.reject : 'Tolak'}</Button>}
    {permissions.can_remove && ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(status) && <Button color="warning" onClick={() => setAction('cancel')} disabled={Boolean(processingAction)}>{processingAction === 'cancel' ? actionLabels.cancel : 'Batalkan'}</Button>}
  </Stack>;

  return <>
    <Breadcrumbs custom heading={header.contract_number || 'Detail Kontrak Rental'} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Kontrak Tarif Rental', to: '/rental-contracts' }, { title: 'Detail' }]} />
    <Stack spacing={2.5}>
      <Paper sx={{ p: { xs: 2.5, md: 3.5 }, color: 'common.white', borderRadius: 2, background: 'linear-gradient(115deg, #173b66 0%, #236b78 100%)' }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.72 }}>Kontrak tarif rental</Typography>
              <Typography variant="h2" sx={{ color: 'inherit', wordBreak: 'break-word' }}>{header.contract_number || `#${id}`}</Typography>
              <Typography sx={{ mt: 0.75, opacity: 0.78 }}>Kelola tarif per equipment dalam satu kontrak.</Typography>
            </Box>
            <Chip color={statusColor[status] || 'default'} sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, bgcolor: 'rgba(255,255,255,.16)', color: 'common.white', fontWeight: 700 }} label={statusLabel[status] || status || 'Status tidak diketahui'} />
          </Stack>
          {actionButtons}
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
        <Grid item xs={12} md={3}><StatCard label="Total Equipment" value={items.length} helper={`${mainCount} main · ${backupCount} backup`} icon={Truck} color="primary" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Grup Tarif" value={groups.length} helper="konfigurasi" icon={ReceiptItem} color="secondary" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Skema Utama" value={items.length ? (billingLabels[items[0].billing_unit] || items[0].billing_unit || '-') : '-'} helper={items.length ? `${items[0].billing_unit || ''}` : ''} icon={Setting2} color="info" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Durasi Kontrak" value={header.start_date && header.end_date ? `${Math.max(1, Math.ceil((new Date(header.end_date) - new Date(header.start_date)) / 86400000))} hari` : '-'} helper={`${formatDate(header.start_date)} - ${formatDate(header.end_date)}`} icon={Calendar} color="success" /></Grid>
      </Grid>

      <MainCard title="Informasi Kontrak" secondary={<InfoCircle size={20} />}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start"><Box sx={{ color: 'primary.main', mt: 0.15 }}><ReceiptItem size={18} /></Box><Box minWidth={0}><Typography variant="caption" color="text.secondary">Unit bisnis</Typography><Typography variant="body2" fontWeight={700}>{header.bisnis?.nama || header.bisnis?.name || header.bisnis_name || header.bisnis_id}</Typography></Box></Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start"><Box sx={{ color: 'primary.main', mt: 0.15 }}><Truck size={18} /></Box><Box minWidth={0}><Typography variant="caption" color="text.secondary">Penyewa</Typography><Typography variant="body2" fontWeight={700}>{header.penyewa?.nama || header.penyewa?.name || header.penyewa_name || header.penyewa_id}</Typography></Box></Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start"><Box sx={{ color: 'primary.main', mt: 0.15 }}><Calendar size={18} /></Box><Box minWidth={0}><Typography variant="caption" color="text.secondary">Mulai kontrak</Typography><Typography variant="body2" fontWeight={700}>{formatDate(header.start_date)}</Typography></Box></Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start"><Box sx={{ color: 'primary.main', mt: 0.15 }}><Calendar size={18} /></Box><Box minWidth={0}><Typography variant="caption" color="text.secondary">Berakhir</Typography><Typography variant="body2" fontWeight={700}>{formatDate(header.end_date)}</Typography></Box></Stack>
          </Grid>
          <Grid item xs={12}><Divider /></Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start"><Box sx={{ color: 'primary.main', mt: 0.15 }}><DocumentText size={18} /></Box><Box minWidth={0}><Typography variant="caption" color="text.secondary">Catatan</Typography><Typography variant="body2" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{header.notes || '-'}</Typography></Box></Stack>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard title="Equipment dan Tarif" secondary={<Chip size="small" label={`${items.length} equipment · ${groups.length} grup`} />}>
        {!items.length ? <Alert severity="info">Belum ada equipment pada kontrak ini.</Alert> : <Stack spacing={2}>
          {groups.map((group, index) => <TariffGroupCard key={group._key || index} group={group} index={index} />)}
        </Stack>}
      </MainCard>

      <MainCard title="Riwayat Aktivitas" secondary={<Clock size={20} />}>
        {auditsLoading ? <Stack spacing={1}><Skeleton height={45} /><Skeleton height={45} /></Stack> : auditsError ? <Alert severity="warning">Riwayat aktivitas tidak dapat dimuat.</Alert> : !audits?.length ? <Alert severity="info">Belum ada aktivitas tercatat.</Alert> : <Stack spacing={0}>{audits.map((audit, index) => <Stack key={audit.id || index} direction="row" spacing={1.5} sx={{ pb: index === audits.length - 1 ? 0 : 2, pt: index ? 2 : 0, borderBottom: index === audits.length - 1 ? 0 : 1, borderColor: 'divider' }}><Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Clock size={15} /></Box><Box><Typography fontWeight={700}>{audit.action || audit.event || audit.status || 'Aktivitas kontrak'}</Typography><Typography variant="body2" color="text.secondary">{audit.description || audit.reason || audit.notes || 'Perubahan tercatat pada kontrak.'}</Typography><Typography variant="caption" color="text.secondary">{formatDate(audit.created_at || audit.createdAt || audit.date)}{audit.user_name || audit.actor_name ? ` · ${audit.user_name || audit.actor_name}` : ''}</Typography></Box></Stack>)}</Stack>}
      </MainCard>
    </Stack>

    <Dialog open={Boolean(action)} onClose={() => !processingAction && setAction('')} fullWidth maxWidth="sm">
      <DialogTitle>{action === 'reject' ? 'Tolak kontrak' : 'Batalkan kontrak'}</DialogTitle>
      <DialogContent><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Berikan alasan agar keputusan ini tercatat dalam riwayat kontrak.</Typography><TextField autoFocus fullWidth required multiline minRows={3} label="Alasan" value={reason} onChange={(event) => setReason(event.target.value)} /></DialogContent>
      <DialogActions><Button onClick={() => setAction('')} disabled={Boolean(processingAction)}>Batal</Button><Button variant="contained" color={action === 'reject' ? 'error' : 'warning'} disabled={Boolean(processingAction) || (needsReason && !reason.trim())} onClick={() => run(action)}>{processingAction === action ? actionLabels[action] : 'Konfirmasi'}</Button></DialogActions>
    </Dialog>
  </>;
}