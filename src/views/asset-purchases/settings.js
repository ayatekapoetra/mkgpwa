'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Add, Edit } from 'iconsax-react';

import { assetEndpoints, useAssetList } from 'api/asset-purchases';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { ASSET_TYPES, FINANCING_TYPES, humanize, money } from './presentation';
import { StateContent, StatusChip } from './shared';

const panelConfig = {
  providers: {
    title: 'Pihak Pembiayaan', endpoint: assetEndpoints.providers, permission: 'can_configure_financing_master', kind: 'provider',
    createPath: '/financing-providers/create', editPath: (id) => `/financing-providers/${id}/edit`
  },
  products: {
    title: 'Produk Pembiayaan', endpoint: assetEndpoints.products, permission: 'can_configure_financing_master', kind: 'product',
    createPath: '/financing-products/create', editPath: (id) => `/financing-products/${id}/edit`
  },
  rules: {
    title: 'Approval Rule', endpoint: assetEndpoints.approvalRules, permission: 'can_configure_approval_matrix', kind: 'rule',
    createPath: '/settings/asset-approval-rules/create', editPath: (id) => `/settings/asset-approval-rules/${id}/edit`
  }
};

function MasterPanel({ configKey }) {
  const config = panelConfig[configKey];
  const result = useAssetList(config.endpoint, { page: 1, per_page: 100 });
  const canConfigure = result.permissions[config.permission];
  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}><Box><Typography variant="h4">{config.title}</Typography><Typography variant="body2" color="text.secondary">Perubahan master tidak mengubah snapshot transaksi yang sudah dibuat.</Typography></Box>{canConfigure && <Button variant="contained" startIcon={<Add />} component={Link} href={config.createPath}>Tambah</Button>}</Stack>
    <StateContent loading={result.loading} error={result.error} empty={!result.rows.length} onRetry={result.mutate}><Grid container spacing={1.5}>{result.rows.map((row) => <Grid item xs={12} md={6} lg={4} key={row.id}><Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}><Stack spacing={1.25}><Stack direction="row" justifyContent="space-between"><Box><Typography variant="caption" color="text.secondary">{row.code || `#${row.id}`}</Typography><Typography variant="h5">{row.name || row.rule_name || `${humanize(row.asset_type)} · ${humanize(row.financing_type)}`}</Typography></Box><StatusChip status={row.is_active === false || row.is_active === 0 ? 'INACTIVE' : 'ACTIVE'} /></Stack>{config.kind === 'rule' ? <><Typography variant="body2">Bisnis {row.requesting_business_name || row.requesting_business_id || '*'} · kategori {row.category_code || '*'}</Typography><Typography fontWeight={700}>{money(row.min_amount)} sampai {row.max_amount ? money(row.max_amount) : 'tanpa batas'}</Typography></> : <><Typography variant="body2">{humanize(row.provider_type || row.financing_type)}</Typography><Typography variant="caption" color="text.secondary">{row.contact_name || row.financing_provider_name || '-'}</Typography></>}{canConfigure && <Button size="small" startIcon={<Edit size={15} />} component={Link} href={config.editPath(row.id)}>Edit</Button>}</Stack></Box></Grid>)}</Grid></StateContent>
  </Stack>;
}

export default function AssetSettings({ type }) {
  const [tab, setTab] = useState('providers');
  const matrix = type === 'matrix';
  return <>
    <Breadcrumbs custom heading={matrix ? 'Approval Matrix Pembelian Aset' : 'Master Pihak Pembiayaan'} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Master' }, { title: matrix ? 'Approval Matrix Pembelian Aset' : 'Master Pihak Pembiayaan' }]} />
    <MainCard content={false}>{matrix ? <Box sx={{ p: { xs: 2, md: 3 } }}><MasterPanel configKey="rules" /></Box> : <><Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}><Tab value="providers" label="Pihak Pembiayaan" /><Tab value="products" label="Produk Pembiayaan" /></Tabs><Box sx={{ p: { xs: 2, md: 3 } }}>{tab === 'providers' ? <MasterPanel configKey="providers" /> : <MasterPanel configKey="products" />}</Box></>}</MainCard>
  </>;
}