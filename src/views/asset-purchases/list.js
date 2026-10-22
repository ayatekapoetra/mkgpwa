'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Add, Filter, SearchNormal1 } from 'iconsax-react';

import { useAssetPurchases } from 'api/asset-purchases';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { ASSET_TYPES, FINANCING_TYPES, date, humanize, money, rowValue } from './presentation';
import { ResponsiveResourceRows, StateContent, StatusChip } from './shared';

const columns = [
  { label: 'Nomor pengajuan', render: (row) => <><Typography fontWeight={700}>{rowValue(row, 'document_number', 'number', 'code')}</Typography><Typography variant="caption" color="text.secondary">{date(row.document_date || row.created_at)}</Typography></> },
  { label: 'Aset', render: (row) => <><Typography variant="body2">{humanize(row.asset_type)}</Typography><Typography variant="caption" color="text.secondary">{row.category_code || '-'}</Typography></> },
  { label: 'Pembiayaan', render: (row) => humanize(row.financing_type) },
  { label: 'Nilai', render: (row) => money(row.approved_amount || row.estimated_amount, row.currency_code || 'IDR') },
  { label: 'Status', render: (row) => <StatusChip status={row.status} /> }
];

export default function AssetPurchaseList() {
  const initial = { search: '', status: '', asset_type: '', financing_type: '', page: 1, per_page: 25 };
  const [filters, setFilters] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const result = useAssetPurchases(filters);
  const canCreate = result.permissions.can_insert;

  return <>
    <Breadcrumbs custom heading="Pembelian Aset" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Accounting/Finance' }, { title: 'Pembelian Aset' }]} />
    <Box sx={{ p: { xs: 2.5, md: 4 }, mb: 3, borderRadius: 3, color: 'common.white', background: 'linear-gradient(125deg, #172554 0%, #1e3a8a 52%, #0f766e 130%)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ md: 'center' }}><Box><Typography variant="overline" sx={{ opacity: .8 }}>CAPEX procurement workspace</Typography><Typography variant="h2" color="inherit">Pembelian aset, terkendali dari usulan hingga unit aktif</Typography><Typography sx={{ mt: 1, opacity: .82 }}>Pantau approval, pembiayaan, pembayaran, penerimaan, dan kapitalisasi dalam satu alur.</Typography></Box>{canCreate && <Button component={Link} href="/asset-purchases/create" variant="contained" color="secondary" startIcon={<Add />}>Pengajuan baru</Button>}</Stack>
    </Box>
    <MainCard content={false}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ p: 2 }}>
        <TextField size="small" placeholder="Cari nomor atau tujuan..." value={draft.search} onChange={(e) => setDraft({ ...draft, search: e.target.value })} InputProps={{ startAdornment: <SearchNormal1 size={17} style={{ marginRight: 8 }} /> }} sx={{ flex: 1 }} />
        <TextField select size="small" label="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} sx={{ minWidth: 170 }}><MenuItem value="">Semua status</MenuItem>{['DRAFT', 'IN_APPROVAL', 'APPROVED', 'PROCUREMENT', 'CONTRACTED', 'ACCEPTED', 'ACTIVE', 'COMPLETED'].map((value) => <MenuItem key={value} value={value}>{humanize(value)}</MenuItem>)}</TextField>
        <TextField select size="small" label="Jenis aset" value={draft.asset_type} onChange={(e) => setDraft({ ...draft, asset_type: e.target.value })} sx={{ minWidth: 160 }}><MenuItem value="">Semua aset</MenuItem>{ASSET_TYPES.map((value) => <MenuItem key={value} value={value}>{humanize(value)}</MenuItem>)}</TextField>
        <TextField select size="small" label="Pembiayaan" value={draft.financing_type} onChange={(e) => setDraft({ ...draft, financing_type: e.target.value })} sx={{ minWidth: 180 }}><MenuItem value="">Semua skema</MenuItem>{FINANCING_TYPES.map((value) => <MenuItem key={value} value={value}>{humanize(value)}</MenuItem>)}</TextField>
        <Button variant="contained" startIcon={<Filter size={17} />} onClick={() => setFilters({ ...draft, page: 1 })}>Terapkan</Button>
      </Stack>
      <StateContent loading={result.loading} error={result.error} empty={!result.rows.length} onRetry={result.mutate} emptyText="Belum ada pengajuan pada filter ini."><ResponsiveResourceRows rows={result.rows} columns={columns} href={(row) => `/asset-purchases/${row.id}`} pagination={result.pagination} setPage={(page) => setFilters({ ...filters, page })} /></StateContent>
    </MainCard>
  </>;
}
