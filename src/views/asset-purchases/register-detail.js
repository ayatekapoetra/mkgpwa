'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Paper, Stack, TextField, Typography } from '@mui/material';

import { assetEndpoints, getAssetErrorMessage, runResourceAction, useAssetContract, useAssetGiro, useAssetPayment } from 'api/asset-purchases';
import { openNotification } from 'api/notification';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import LoadingScreen from 'components/screens/LoadingScreen';
import ErrorScreen from 'components/screens/ErrorScreen';
import { APP_DEFAULT_PATH } from 'config';
import { date, humanize, money, rowValue } from './presentation';
import { StatusChip } from './shared';

const definitions = {
  contracts: { title: 'Kontrak Pembiayaan', base: '/asset-financing-contracts', hook: useAssetContract, endpoint: assetEndpoints.contract, actions: [['activate', 'Aktifkan', 'can_manage_contract'], ['restructure', 'Restrukturisasi', 'can_manage_contract'], ['request-ownership-transfer', 'Ajukan transfer ownership', 'can_manage_contract'], ['confirm-ownership-transfer', 'Konfirmasi transfer ownership', 'can_manage_contract']] },
  payments: { title: 'Instruksi Pembayaran', base: '/asset-payment-instructions', hook: useAssetPayment, endpoint: assetEndpoints.payment, actions: [['submit', 'Submit', 'can_create_payment_instruction'], ['approve', 'Setujui', 'can_approve_payment_instruction'], ['execute', 'Eksekusi pembayaran', 'can_execute_payment'], ['void', 'Void', 'can_execute_payment']] },
  giros: { title: 'Giro Aset', base: '/asset-giros', hook: useAssetGiro, endpoint: assetEndpoints.giro, actions: [['approve', 'Setujui', 'can_manage_giro'], ['issue', 'Terbitkan', 'can_manage_giro'], ['hand-over', 'Serahkan', 'can_manage_giro'], ['hold', 'Tahan sebagai collateral', 'can_manage_giro'], ['approve-execution', 'Setujui eksekusi', 'can_manage_giro'], ['present', 'Present', 'can_manage_giro'], ['clear', 'Clearing', 'can_clear_giro'], ['bounce', 'Tandai bounced', 'can_clear_giro'], ['return', 'Kembalikan', 'can_manage_giro'], ['void', 'Void', 'can_manage_giro']] }
};

function MutationDialog({ action, open, onClose, onSubmit, loading }) {
  const [notes, setNotes] = useState('');
  return <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm"><DialogTitle>{action?.[1]}</DialogTitle><DialogContent><Alert severity="info" sx={{ mb: 2 }}>Aksi ini dicatat pada audit trail dan menggunakan idempotency key baru.</Alert><TextField fullWidth multiline minRows={3} label="Catatan/alasan" value={notes} onChange={(event) => setNotes(event.target.value)} /></DialogContent><DialogActions><Button onClick={onClose}>Batal</Button><Button variant="contained" disabled={loading} onClick={() => onSubmit({ reason: notes, notes })}>Konfirmasi</Button></DialogActions></Dialog>;
}

export default function AssetRegisterDetail({ type, id }) {
  const definition = definitions[type];
  const result = definition.hook(id);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  if (result.loading) return <LoadingScreen fullScreen={false} message={`Memuat ${definition.title.toLowerCase()}`} />;
  if (result.error || !result.row) return <ErrorScreen error={result.error || { message: 'Data tidak ditemukan' }} variant="data" showDetails={false} />;
  if (!result.permissions.can_read) return <ErrorScreen error={{ message: `Anda tidak memiliki akses ke ${definition.title.toLowerCase()} ini.` }} variant="data" showDetails={false} />;
  const row = result.row;
  const process = async (payload) => { setLoading(true); try { await runResourceAction(definition.endpoint(id), action[0], payload, row.version); openNotification({ open: true, title: 'success', message: 'Aksi berhasil diproses', alert: { color: 'success' } }); setAction(null); result.mutate(); } catch (error) { openNotification({ open: true, title: 'error', message: getAssetErrorMessage(error), alert: { color: 'error' } }); } finally { setLoading(false); } };
  const excluded = ['id', 'permissions', 'installments', 'allocations', 'histories', 'version', 'status'];
  const values = Object.entries(row).filter(([key, value]) => !excluded.includes(key) && ['string', 'number', 'boolean'].includes(typeof value));
  return <>
    <Breadcrumbs custom heading={definition.title} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: definition.title, to: definition.base }, { title: String(id) }]} />
    <MainCard content={false}><Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: 'primary.lighter' }}><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="overline">{definition.title}</Typography><Typography variant="h2">{rowValue(row, 'contract_number', 'instruction_number', 'document_number', 'masked_giro_number', 'giro_number', 'number')}</Typography><Stack direction="row" gap={1} sx={{ mt: 1 }}><StatusChip status={row.status} />{row.purpose && <StatusChip status={row.purpose} />}</Stack></Box><Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ md: 'center' }}>{definition.actions.filter((item) => result.permissions[item[2]]).map((item) => <Button key={item[0]} variant={item[0] === 'activate' || item[0] === 'execute' || item[0] === 'clear' ? 'contained' : 'outlined'} color={['void', 'bounce'].includes(item[0]) ? 'error' : 'primary'} onClick={() => setAction(item)}>{item[1]}</Button>)}</Stack></Stack></Box>
      <Box sx={{ p: { xs: 2, md: 3 } }}><Grid container spacing={2}><Grid item xs={12} lg={8}><Paper variant="outlined" sx={{ p: 2.5 }}><Typography variant="h5" sx={{ mb: 2 }}>Informasi</Typography><Grid container spacing={2}>{values.map(([key, value]) => <Grid item xs={6} md={4} key={key}><Typography variant="caption" color="text.secondary">{humanize(key)}</Typography><Typography fontWeight={650} sx={{ wordBreak: 'break-word' }}>{key.includes('amount') || key.includes('principal') ? money(value, row.currency_code) : key.includes('date') ? date(value) : humanize(value)}</Typography></Grid>)}</Grid></Paper></Grid><Grid item xs={12} lg={4}><Paper variant="outlined" sx={{ p: 2.5 }}><Typography variant="h5">Keterkaitan</Typography><Divider sx={{ my: 2 }} /><Stack spacing={1}><Typography variant="body2">Pengajuan: {row.asset_purchase_number || row.asset_purchase_id || '-'}</Typography>{row.asset_purchase_id && <Button component={Link} href={`/asset-purchases/${row.asset_purchase_id}`} variant="outlined">Buka pengajuan</Button>}</Stack></Paper></Grid></Grid>
        {type === 'contracts' && <Paper variant="outlined" sx={{ p: 2.5, mt: 2 }}><Typography variant="h5" sx={{ mb: 2 }}>Jadwal angsuran</Typography>{(row.installments || []).length ? <Stack divider={<Divider />} spacing={1.5}>{row.installments.map((item) => <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"><Box><Typography fontWeight={700}>Angsuran #{item.installment_number}</Typography><Typography variant="caption">Jatuh tempo {date(item.due_date)}</Typography></Box><Box sx={{ textAlign: { sm: 'right' } }}><Typography>{money(item.outstanding_amount ?? item.total_due, row.currency_code)}</Typography><StatusChip status={item.status} /></Box></Stack>)}</Stack> : <Typography color="text.secondary">Jadwal belum tersedia. Jadwal dibentuk backend saat kontrak diaktifkan.</Typography>}</Paper>}
      </Box>
    </MainCard><MutationDialog action={action} open={Boolean(action)} onClose={() => setAction(null)} onSubmit={process} loading={loading} />
  </>;
}
