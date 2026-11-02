'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Add, Filter, SearchNormal1 } from 'iconsax-react';

import { assetEndpoints, getAssetErrorMessage, runGiroBulkAction, runResourceAction, useAssetContracts, useAssetGiros, useAssetPayments } from 'api/asset-purchases';
import { openNotification } from 'api/notification';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { date, humanize, money, rowValue } from './presentation';
import { ResponsiveResourceRows, StateContent, StatusChip } from './shared';

const definitions = {
  contracts: {
    title: 'Kontrak Pembiayaan', base: '/asset-financing-contracts', hook: useAssetContracts,
    createPath: null,
    statuses: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'RESTRUCTURED', 'SETTLEMENT_PENDING', 'OWNERSHIP_TRANSFER_PENDING', 'COMPLETED', 'DEFAULTED'],
    columns: [
      { label: 'Nomor kontrak', render: (row) => <><Typography fontWeight={700}>{rowValue(row, 'contract_number', 'number')}</Typography><Typography variant="caption" color="text.secondary">{row.provider_name || row.financing_provider_name || '-'}</Typography></> },
      { label: 'Pengajuan', render: (row) => row.purchase_document_number || row.asset_purchase_number || row.asset_purchase_id || '-' },
      { label: 'Jatuh tempo', render: (row) => date(row.maturity_date) },
      { label: 'Outstanding', render: (row) => money(row.outstanding_principal ?? row.principal_amount, row.currency_code) },
      { label: 'Status', render: (row) => <StatusChip status={row.status} /> }
    ]
  },
  payments: {
    title: 'Instruksi Pembayaran Aset', base: '/asset-payment-instructions', hook: useAssetPayments,
    createPermission: 'can_create_payment_instruction', createPath: '/asset-payment-instructions/create',
    statuses: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PAYMENT_IN_PROCESS', 'EXECUTED', 'VERIFIED', 'POSTED', 'FAILED', 'VOIDED'],
    columns: [
      { label: 'Nomor instruksi', render: (row) => <><Typography fontWeight={700}>{rowValue(row, 'instruction_number', 'document_number', 'number')}</Typography><Typography variant="caption" color="text.secondary">{date(row.instruction_date || row.created_at)}</Typography></> },
      { label: 'Penerima', render: (row) => row.payee_name || humanize(row.payee_type) },
      { label: 'Tujuan', render: (row) => humanize(row.payment_purpose || row.purpose) },
      { label: 'Nilai', render: (row) => money(row.amount, row.currency_code) },
      { label: 'Status', render: (row) => <StatusChip status={row.status} /> }
    ]
  },
  giros: {
    title: 'Register Giro Aset', base: '/asset-giros', hook: useAssetGiros, endpoint: assetEndpoints.giro,
    createPermission: 'can_manage_giro', createPath: '/asset-giros/create',
    statuses: ['DRAFT', 'APPROVED', 'ISSUED', 'HANDED_OVER', 'PRESENTED', 'HELD_AS_COLLATERAL', 'CLEARED', 'BOUNCED', 'RETURNED', 'VOIDED'],
    columns: [
      { label: 'Nomor giro', render: (row) => <><Typography fontWeight={700}>{rowValue(row, 'masked_giro_number', 'giro_number', 'number')}</Typography><Typography variant="caption" color="text.secondary">{humanize(row.purpose)}</Typography></> },
      { label: 'Penerima', render: (row) => row.payee_name || '-' },
      { label: 'Tanggal efektif', render: (row) => date(row.effective_date) },
      { label: 'Nominal', render: (row) => money(row.amount, row.currency_code) },
      { label: 'Status', render: (row) => <StatusChip status={row.status} /> }
    ]
  }
};

function BulkGiroDialog({ open, onClose, onSubmit, action, count, loading }) {
  const isClear = action === 'CLEARED' || action === 'clear';
  const actionLabel = isClear ? 'Pencairan (CLEARED)' : 'Penyerahan (DELIVERED)';
  const [clearingDate, setClearingDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Konfirmasi Massal: Set Status {actionLabel}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Tindakan ini akan memproses <strong>{count}</strong> giro terpilih secara bersamaan.
        </Alert>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type="date"
            label={isClear ? 'Tanggal Pencairan Efektif' : 'Tanggal Penyerahan'}
            value={clearingDate}
            onChange={(e) => setClearingDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          {isClear && (
            <TextField
              fullWidth
              label="Referensi Mutasi Bank"
              placeholder="Contoh: MUT-BCA-20261026-001"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          )}
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Catatan"
            placeholder="Catatan tambahan (opsional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button
          variant="contained"
          color={isClear ? 'success' : 'primary'}
          disabled={loading}
          onClick={() => onSubmit({
            clearing_date: clearingDate,
            effective_date: clearingDate,
            bank_mutation_reference: reference,
            notes,
            reason: notes
          })}
        >
          {loading ? 'Memproses...' : `Konfirmasi (${count} Giro)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AssetRegisterList({ type }) {
  const definition = definitions[type];
  const initial = { search: '', status: '', page: 1, per_page: 25 };
  const [filters, setFilters] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const result = definition.hook(filters);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? (result.rows || []).map((r) => r.id) : []);
  };

  const handleBulkSubmit = async (payload) => {
    setBulkLoading(true);
    try {
      const actionKey = bulkAction === 'DELIVERED' ? 'hand-over' : bulkAction === 'CLEARED' ? 'clear' : bulkAction;
      try {
        await runGiroBulkAction(selectedIds, actionKey, payload);
      } catch (err) {
        if (err?.response?.status === 404 && definition.endpoint) {
          const promises = selectedIds.map((id) =>
            runResourceAction(definition.endpoint(id), actionKey, payload)
          );
          await Promise.all(promises);
        } else {
          throw err;
        }
      }
      openNotification({
        open: true,
        title: 'success',
        message: `${selectedIds.length} giro berhasil diproses ke status ${bulkAction}`,
        alert: { color: 'success' }
      });
      setSelectedIds([]);
      setBulkAction(null);
      result.mutate();
    } catch (error) {
      openNotification({
        open: true,
        title: 'error',
        message: getAssetErrorMessage(error, 'Gagal memproses aksi massal giro'),
        alert: { color: 'error' }
      });
    } finally {
      setBulkLoading(false);
    }
  };

  return <>
    <Breadcrumbs custom heading={definition.title} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Accounting/Finance' }, { title: definition.title }]} />
    <MainCard content={false}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h4">{definition.title}</Typography>
            <Typography variant="body2" color="text.secondary">Data dibatasi otomatis sesuai business scope dan rekening pengguna.</Typography>
          </Box>
          {definition.createPermission && result.permissions[definition.createPermission] && definition.createPath && (
            <Button variant="contained" startIcon={<Add />} component={Link} href={definition.createPath}>Tambah</Button>
          )}
        </Stack>
      </Box>
      {type === 'giros' && selectedIds.length > 0 && (
        <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, bgcolor: 'primary.lighter', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
            <Typography variant="subtitle1" color="primary.dark">
              <strong>{selectedIds.length}</strong> giro dipilih
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" color="info" onClick={() => setBulkAction('DELIVERED')}>
                Set Status Diserahkan (DELIVERED)
              </Button>
              <Button size="small" variant="contained" color="success" onClick={() => setBulkAction('CLEARED')}>
                Set Status Cair (CLEARED)
              </Button>
              <Button size="small" variant="outlined" color="inherit" onClick={() => setSelectedIds([])}>
                Batal
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }}>
        <TextField size="small" placeholder="Cari nomor atau penerima..." value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} InputProps={{ startAdornment: <SearchNormal1 size={17} style={{ marginRight: 8 }} /> }} sx={{ flex: 1 }} />
        <TextField select size="small" label="Status" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} sx={{ minWidth: 210 }}>
          <MenuItem value="">Semua status</MenuItem>
          {definition.statuses.map((status) => <MenuItem value={status} key={status}>{humanize(status)}</MenuItem>)}
        </TextField>
        <Button variant="contained" startIcon={<Filter size={17} />} onClick={() => setFilters({ ...draft, page: 1 })}>Terapkan</Button>
      </Stack>
      <StateContent loading={result.loading} error={result.error} empty={!result.rows.length} onRetry={result.mutate}>
        <ResponsiveResourceRows
          rows={result.rows}
          columns={definition.columns}
          href={(row) => `${definition.base}/${row.id}`}
          pagination={result.pagination}
          setPage={(page) => setFilters({ ...filters, page })}
          selectable={type === 'giros'}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
        />
      </StateContent>
    </MainCard>
    <BulkGiroDialog
      open={Boolean(bulkAction)}
      onClose={() => setBulkAction(null)}
      onSubmit={handleBulkSubmit}
      action={bulkAction}
      count={selectedIds.length}
      loading={bulkLoading}
    />
  </>;
}