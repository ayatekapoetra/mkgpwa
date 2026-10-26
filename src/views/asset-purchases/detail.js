'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Add, DocumentDownload, Edit, TickCircle } from 'iconsax-react';

import { assetEndpoints, getAssetErrorMessage, getAssetPurchasePoPdf, runApprovalAction, runPurchaseAction, useAssetDetail, useAssetList, useAssetPurchase } from 'api/asset-purchases';
import { openNotification } from 'api/notification';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';
import { APP_DEFAULT_PATH } from 'config';
import { date, humanize, money, rowValue } from './presentation';
import { StateContent, StatusChip } from './shared';

const tabs = [
  ['summary', 'Ringkasan'], ['items', 'Item'], ['approval', 'Approval'], ['offers', 'Penawaran Vendor'], ['financing', 'Pembiayaan'],
  ['payments', 'Pembayaran'], ['receipts', 'Penerimaan'], ['units', 'Unit Aset'], ['documents', 'Dokumen'], ['integration', 'Integrasi Accounting'], ['audit', 'Audit']
];

const sectionEndpoints = {
  approval: assetEndpoints.approvalSteps, offers: assetEndpoints.offers, financing: assetEndpoints.proposals,
  receipts: assetEndpoints.receipts, units: assetEndpoints.units
};

const sectionConfig = {
  offers: { title: 'Penawaran vendor', permission: 'can_procure', createPath: (id) => `/asset-purchases/${id}/offers/create`, editPath: (id, rowId) => `/asset-purchases/${id}/offers/${rowId}/edit` },
  financing: { title: 'Proposal pembiayaan', permission: 'can_verify_financing', createPath: (id) => `/asset-purchases/${id}/financing/create`, editPath: (id, rowId) => `/asset-purchases/${id}/financing/${rowId}/edit` },
  receipts: { title: 'Penerimaan aset', permission: 'can_receive', createPath: (id) => `/asset-purchases/${id}/receipts/create`, editPath: (id, rowId) => `/asset-purchases/${id}/receipts/${rowId}/edit` }
};

function Info({ label, value }) { return <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={650} sx={{ mt: .3, wordBreak: 'break-word' }}>{value ?? '-'}</Typography></Box>; }

function RowCards({ rows, kind, canSelect, onSelect, editPath }) {
  if (!rows.length) return <Typography color="text.secondary">Belum ada data.</Typography>;
  return <Grid container spacing={1.5}>{rows.map((row, index) => <Grid item xs={12} md={6} key={row.id || index}><Card variant="outlined" sx={{ height: '100%', borderColor: row.is_selected ? 'success.main' : 'divider' }}><CardContent><Stack spacing={1.25}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="caption" color="text.secondary">{kind} {index + 1}</Typography><Typography variant="h6">{rowValue(row, 'offer_number', 'proposal_number', 'receipt_number', 'document_number', 'unit_sequence')}</Typography></Box>{row.status ? <StatusChip status={row.status} /> : row.is_selected ? <Chip size="small" color="success" label="Dipilih" /> : null}</Stack><Divider />{Object.entries(row).filter(([key, value]) => !['id', 'status', 'is_selected', 'created_at', 'updated_at'].includes(key) && ['string', 'number'].includes(typeof value)).slice(0, 6).map(([key, value]) => <Stack key={key} direction="row" justifyContent="space-between" gap={2}><Typography variant="caption" color="text.secondary">{humanize(key)}</Typography><Typography variant="body2" textAlign="right">{String(value)}</Typography></Stack>)}<Stack direction="row" spacing={1}>{canSelect && !row.is_selected && <Button variant="outlined" startIcon={<TickCircle size={16} />} onClick={() => onSelect(row)}>Pilih</Button>}{editPath && <Button component={Link} href={editPath(row.id)} startIcon={<Edit size={15} />}>Edit</Button>}</Stack></Stack></CardContent></Card></Grid>)}</Grid>;
}

function ActionDialog({ action, open, onClose, onSubmit, loading }) {
  const needsReason = ['reject', 'return', 'cancel'].includes(action);
  const [reason, setReason] = useState('');
  return <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm"><DialogTitle>{humanize(action)} pengajuan</DialogTitle><DialogContent><Typography sx={{ mb: 2 }}>Pastikan data dan dokumen pendukung sudah diperiksa.</Typography>{needsReason && <TextField fullWidth required multiline minRows={3} label="Alasan" value={reason} onChange={(e) => setReason(e.target.value)} />}</DialogContent><DialogActions><Button onClick={onClose}>Batal</Button><Button variant="contained" color={action === 'reject' ? 'error' : 'primary'} disabled={loading || (needsReason && !reason.trim())} onClick={() => onSubmit({ reason: reason.trim() })}>{loading ? 'Memproses...' : 'Konfirmasi'}</Button></DialogActions></Dialog>;
}

function ApprovalSection({ purchase, permissions }) {
  const result = useAssetList(assetEndpoints.approvalSteps(purchase.id));
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const active = result.rows.find((row) => ['PENDING', 'ACTIVE'].includes(row.status) || row.is_actionable);
  const process = async (payload) => { setLoading(true); try { await runApprovalAction(purchase.id, active.id, action, payload, purchase.version); openNotification({ open: true, title: 'success', message: 'Keputusan approval tersimpan', alert: { color: 'success' } }); setAction(null); result.mutate(); } catch (error) { openNotification({ open: true, title: 'error', message: getAssetErrorMessage(error), alert: { color: 'error' } }); } finally { setLoading(false); } };
  return <StateContent loading={result.loading} error={result.error} empty={!result.rows.length} onRetry={result.mutate}><Stack spacing={1.5}>{result.rows.map((step) => <Paper variant="outlined" sx={{ p: 2 }} key={step.id}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}><Box><Typography fontWeight={700}>{step.sequence}. {step.name || humanize(step.step_type)}</Typography><Typography variant="body2" color="text.secondary">{step.approver_name || step.approver_role || humanize(step.approver_type)} · quorum {step.approval_count || 0}/{step.required_approvals || 1}</Typography></Box><StatusChip status={step.status} /></Stack></Paper>)}{permissions.can_approve && active && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" color="success" onClick={() => setAction('approve')}>Setujui step aktif</Button>{permissions.can_reject && <Button color="error" onClick={() => setAction('reject')}>Tolak</Button>}{permissions.can_return && <Button color="warning" onClick={() => setAction('return')}>Kembalikan</Button>}</Stack>}<ActionDialog action={action} open={Boolean(action)} onClose={() => setAction(null)} onSubmit={process} loading={loading} /></Stack></StateContent>;
}

function LazyResourceSection({ tab, purchase, permissions }) {
  const endpoint = sectionEndpoints[tab]?.(purchase.id);
  const result = useAssetList(endpoint, {}, Boolean(endpoint));
  const config = sectionConfig[tab];
  const select = async (row) => { try { await import('api/asset-purchases').then(({ assetMutation }) => assetMutation('post', `${endpoint}/${row.id}/select`, {}, purchase.version)); result.mutate(); openNotification({ open: true, title: 'success', message: 'Pilihan berhasil diperbarui', alert: { color: 'success' } }); } catch (error) { openNotification({ open: true, title: 'error', message: getAssetErrorMessage(error), alert: { color: 'error' } }); } };
  return <Stack spacing={2}>{config && permissions[config.permission] && <Box><Button variant="contained" startIcon={<Add />} component={Link} href={config.createPath(purchase.id)}>Tambah {config.title}</Button></Box>}<StateContent loading={result.loading} error={result.error} empty={!result.rows.length} onRetry={result.mutate}><RowCards rows={result.rows} kind={config?.title || humanize(tab)} canSelect={['offers', 'financing'].includes(tab) && permissions[config?.permission]} onSelect={select} editPath={config?.editPath ? (rowId) => config.editPath(purchase.id, rowId) : null} /></StateContent></Stack>;
}

function ContractSection({ purchase, permissions }) {
  const result = useAssetList(assetEndpoints.contracts, { asset_purchase_id: purchase.id });
  return <Box sx={{ mt: 3 }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}><Box><Typography variant="h5">Kontrak dan jadwal angsuran</Typography><Typography variant="body2" color="text.secondary">{purchase.financing_type === 'CASH' ? 'Pembelian tunai tidak memerlukan kontrak pembiayaan.' : 'Jadwal dibentuk backend saat kontrak diaktifkan.'}</Typography></Box>{purchase.financing_type !== 'CASH' && permissions.can_manage_contract && !result.rows.length && <Button startIcon={<Add />} component={Link} href={`/asset-purchases/${purchase.id}/contracts/create`}>Buat kontrak</Button>}</Stack><StateContent loading={result.loading} error={result.error} empty={!result.rows.length} onRetry={result.mutate}><RowCards rows={result.rows} kind="Kontrak" editPath={(rowId) => `/asset-financing-contracts/${rowId}`} /></StateContent></Box>;
}

function PurchasePayments({ purchase }) {
  const result = useAssetList(assetEndpoints.payments, { asset_purchase_id: purchase.id });
  return <StateContent loading={result.loading} error={result.error} empty={!result.rows.length} onRetry={result.mutate}><RowCards rows={result.rows} kind="Instruksi Pembayaran" editPath={(rowId) => `/asset-payment-instructions/${rowId}`} /></StateContent>;
}

export default function AssetPurchaseDetail({ id, initialTab = 'summary' }) {
  const result = useAssetPurchase(id);
  const [tab, setTab] = useState(initialTab);
  const [action, setAction] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const purchase = result.row;
  if (result.loading) return <LoadingScreen fullScreen={false} message="Memuat pembelian aset" />;
  if (result.error || !purchase) return <ErrorScreen error={result.error || { message: 'Pembelian aset tidak ditemukan' }} variant="data" showDetails={false} />;
  if (!result.permissions.can_read) return <ErrorScreen error={{ message: 'Anda tidak memiliki hak akses untuk melihat pembelian aset ini.' }} variant="data" showDetails={false} />;

  const handlePrintPoPdf = async () => {
    setLoadingPdf(true);
    try {
      const response = await getAssetPurchasePoPdf(id);
      const contentDisposition = response.headers?.['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `PO-Asset-${purchase.document_number || id}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      openNotification({
        open: true,
        title: 'success',
        message: 'PO PDF berhasil diunduh',
        alert: { color: 'success' }
      });
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: getAssetErrorMessage(error, 'Gagal mengunduh PO PDF'),
        alert: { color: 'error' }
      });
    } finally {
      setLoadingPdf(false);
    }
  };

  const processAction = async (payload) => { setLoadingAction(true); try { await runPurchaseAction(id, action, payload, purchase.version); openNotification({ open: true, title: 'success', message: 'Status pengajuan berhasil diperbarui', alert: { color: 'success' } }); setAction(null); result.mutate(); } catch (error) { openNotification({ open: true, title: 'error', message: getAssetErrorMessage(error), alert: { color: 'error' } }); } finally { setLoadingAction(false); } };
  const embedded = { items: purchase.items || [], documents: purchase.documents || purchase.files || [], integration: purchase.integration_links || purchase.integrations || [], audit: purchase.histories || purchase.audit || [] };

  return <>
    <Breadcrumbs custom heading="Detail Pembelian Aset" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Pembelian Aset', to: '/asset-purchases' }, { title: purchase.document_number || id }]} />
    <MainCard content={false}>
      <Box sx={{ p: { xs: 2.5, md: 3 }, background: 'linear-gradient(135deg, rgba(30,58,138,.12), rgba(15,118,110,.04))' }}><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="overline" color="primary.main">Pembelian Aset</Typography><Typography variant="h2">{rowValue(purchase, 'document_number', 'number')}</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>{purchase.purpose || '-'}</Typography><Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}><StatusChip status={purchase.status} /><Chip variant="outlined" label={humanize(purchase.asset_type)} /><Chip variant="outlined" label={humanize(purchase.financing_type)} /><Chip variant="outlined" label={`Revisi ${purchase.revision_number || 0}`} /></Stack></Box><Box sx={{ textAlign: { md: 'right' } }}><Typography variant="caption" color="text.secondary">Nilai pengajuan</Typography><Typography variant="h3" color="primary.main">{money(purchase.approved_amount || purchase.estimated_amount, purchase.currency_code)}</Typography><Stack direction="row" spacing={1} justifyContent={{ md: 'flex-end' }} sx={{ mt: 1.5 }}>{purchase.status === 'APPROVED' && <Button variant="outlined" color="primary" startIcon={loadingPdf ? <CircularProgress size={16} color="inherit" /> : <DocumentDownload size={17} />} disabled={loadingPdf} onClick={handlePrintPoPdf}>Cetak PO (PDF)</Button>}{result.permissions.can_update && ['DRAFT', 'RETURNED'].includes(purchase.status) && <Button component={Link} href={`/asset-purchases/${id}/edit`} startIcon={<Edit size={17} />}>Edit</Button>}{result.permissions.can_submit && ['DRAFT', 'RETURNED'].includes(purchase.status) && <Button variant="contained" onClick={() => setAction('submit')}>Submit</Button>}{result.permissions.can_return && !['DRAFT', 'COMPLETED', 'CANCELLED'].includes(purchase.status) && <Button color="warning" onClick={() => setAction('return')}>Return</Button>}</Stack></Box></Stack></Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}><Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">{tabs.filter(([value]) => value !== 'audit' || result.permissions.can_view_audit).map(([value, label]) => <Tab key={value} value={value} label={label} />)}</Tabs></Box>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {tab === 'summary' && <Grid container spacing={2}><Grid item xs={12} md={8}><Paper variant="outlined" sx={{ p: 2.5 }}><Typography variant="h5" sx={{ mb: 2 }}>Informasi transaksi</Typography><Grid container spacing={2}>{[['Tanggal dokumen', date(purchase.document_date)], ['Jenis aset', humanize(purchase.asset_type)], ['Kategori', purchase.category_code], ['Pembiayaan', humanize(purchase.financing_type)], ['Kepemilikan', humanize(purchase.ownership_scheme)], ['Budget', humanize(purchase.budget_status)], ['Referensi budget', purchase.budget_reference], ['Versi', purchase.version]].map(([label, value]) => <Grid item xs={6} md={4} key={label}><Info label={label} value={value} /></Grid>)}</Grid></Paper></Grid><Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 2.5 }}><Typography variant="h5" sx={{ mb: 2 }}>Dimensi organisasi</Typography><Stack spacing={2}><Info label="Bisnis pemohon" value={purchase.requesting_business_name || purchase.requesting_business_id} /><Info label="Legal owner" value={purchase.legal_owner_business_name || purchase.legal_owner_business_id} /><Info label="Perusahaan pembayar" value={purchase.paying_business_name || purchase.paying_business_id} /><Info label="Pengguna operasional" value={purchase.operational_user_business_name || purchase.operational_user_business_id} /></Stack></Paper></Grid></Grid>}
        {tab === 'approval' && <ApprovalSection purchase={purchase} permissions={result.permissions} />}
        {['offers', 'financing', 'receipts', 'units'].includes(tab) && <><LazyResourceSection tab={tab} purchase={purchase} permissions={result.permissions} />{tab === 'financing' && <ContractSection purchase={purchase} permissions={result.permissions} />}</>}
        {tab === 'payments' && <PurchasePayments purchase={purchase} />}
        {['items', 'documents', 'integration', 'audit'].includes(tab) && <RowCards rows={embedded[tab] || []} kind={tabs.find(([value]) => value === tab)?.[1]} />}
      </Box>
    </MainCard>
    <ActionDialog action={action} open={Boolean(action)} onClose={() => setAction(null)} onSubmit={processAction} loading={loadingAction} />
  </>;
}