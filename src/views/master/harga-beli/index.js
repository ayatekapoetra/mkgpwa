'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Box1, Building, Edit2, Filter, MoneyRecive, UsdCoin } from 'iconsax-react';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import Paginate from 'components/Paginate';
import { APP_DEFAULT_PATH } from 'config';
import { useHargaBeliList, useHargaBeliOptions } from 'api/harga-beli';
import HargaBeliFilter from './filter';

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;

function SummaryCard({ label, value, detail, icon, color, loading }) {
  return <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: (theme) => alpha(color || theme.palette.primary.main, 0.035), backgroundImage: (theme) => `linear-gradient(150deg, ${alpha(color || theme.palette.primary.main, 0.12)}, transparent 65%)` }}><CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}><Stack direction="row" justifyContent="space-between" spacing={1}><Box><Typography variant="caption" color="text.secondary">{label}</Typography>{loading ? <CircularProgress size={18} sx={{ display: 'block', mt: 1 }} /> : <Typography variant="h4" fontWeight={800}>{value}</Typography>}<Typography variant="caption" color="text.secondary">{detail}</Typography></Box><Box sx={{ width: 38, height: 38, borderRadius: 1.5, display: 'grid', placeItems: 'center', color, bgcolor: alpha(color, 0.13) }}>{icon}</Box></Stack></CardContent></Card>;
}

function PriceCard({ row, canUpdate }) {
  return <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Stack spacing={1.25}><Stack direction="row" justifyContent="space-between"><Box><Typography variant="subtitle1" fontWeight={700}>{row.barang_kode || '-'}</Typography><Typography variant="body2">{row.barang_nama || '-'}</Typography></Box><Chip size="small" label={row.aktif === 'Y' ? 'Aktif' : 'Tidak Aktif'} color={row.aktif === 'Y' ? 'success' : 'default'} /></Stack><Typography variant="h5" color="primary.main" fontWeight={800}>{formatCurrency(row.harga_beli)} <Typography component="span" variant="caption" color="text.secondary">/{row.satuan || '-'}</Typography></Typography><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">{row.periode} · {row.gudang_kode || row.gudang_nama || '-'}</Typography>{canUpdate ? <IconButton component={Link} href={`/harga-beli/${row.id}/edit`} size="small" color="primary"><Edit2 size={17} /></IconButton> : null}</Stack></Stack></Paper>;
}

export default function HargaBeliScreen() {
  const theme = useTheme();
  const [filters, setFilters] = useState({ page: 1, perPage: 25, search: '', barang_id: '', bisnis_id: '', gudang_id: '', periode_from: '', periode_to: '', aktif: 'Y' });
  const [openFilter, setOpenFilter] = useState(false);
  const { rows, summary, permissions, page, perPage, lastPage, total, loading, refreshing, error } = useHargaBeliList(filters);
  const { options } = useHargaBeliOptions();
  const canInsert = permissions.can_insert === true;
  const canUpdate = permissions.can_update === true;
  const breadcrumbs = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Master' }, { title: 'Harga Beli' }];

  return <Fragment><Breadcrumbs custom heading="Harga Beli" links={breadcrumbs} /><MainCard content={false} title={<Button component={Link} href="/harga-beli/create" variant="contained" disabled={!canInsert}>Tambah Harga</Button>} secondary={<Tooltip title="Filter"><IconButton color="secondary" onClick={() => setOpenFilter(true)}><Filter /></IconButton></Tooltip>}>
    <HargaBeliFilter open={openFilter} onClose={() => setOpenFilter(false)} filters={filters} setFilters={setFilters} options={options} total={total} />
    <Box sx={{ p: 2.5, pb: 0 }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
      <SummaryCard label="Record Harga" value={total} detail="Sesuai filter aktif" icon={<UsdCoin size={20} variant="Bold" />} color={theme.palette.primary.main} loading={loading} />
      <SummaryCard label="Barang" value={Number(summary.total_barang) || 0} detail="Barang dengan harga" icon={<Box1 size={20} variant="Bold" />} color={theme.palette.info.main} loading={loading} />
      <SummaryCard label="Gudang" value={Number(summary.total_gudang) || 0} detail={`Periode terbaru ${summary.latest_period || '-'}`} icon={<Building size={20} variant="Bold" />} color={theme.palette.success.main} loading={loading} />
      <SummaryCard label="Rata-rata Harga" value={formatCurrency(summary.average_price)} detail="Harga order aktif" icon={<MoneyRecive size={20} variant="Bold" />} color={theme.palette.warning.main} loading={loading} />
    </Box></Box>
    {error ? <Alert severity="error" sx={{ m: 2.5 }}>{error?.message || 'Gagal memuat harga beli. Pastikan Anda memiliki akses.'}</Alert> : loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : <Stack spacing={2} sx={{ p: 2.5 }}>
      {refreshing ? <CircularProgress size={18} sx={{ alignSelf: 'flex-end' }} /> : null}
      <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.25 }}>{rows.length ? rows.map((row) => <PriceCard key={row.id} row={row} canUpdate={canUpdate} />) : <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>Belum ada data harga beli.</Typography>}</Box>
      <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}><Table sx={{ minWidth: 1050 }}><TableHead><TableRow><TableCell>No</TableCell><TableCell>Barang</TableCell><TableCell>Periode</TableCell><TableCell>Bisnis / Gudang</TableCell><TableCell align="right">Harga Order</TableCell><TableCell align="right">Harga Pakai</TableCell><TableCell>Status</TableCell><TableCell align="center">Aksi</TableCell></TableRow></TableHead><TableBody>{rows.length ? rows.map((row, index) => <TableRow key={row.id} hover><TableCell>{(page - 1) * perPage + index + 1}</TableCell><TableCell><Typography variant="body2" fontWeight={700}>{row.barang_kode || '-'}</Typography><Typography variant="caption" color="text.secondary">{row.barang_nama || '-'}</Typography></TableCell><TableCell>{row.periode || '-'}</TableCell><TableCell><Typography variant="body2">{row.bisnis_initial || row.bisnis_nama || '-'}</Typography><Typography variant="caption" color="text.secondary">{row.gudang_kode ? `${row.gudang_kode} - ${row.gudang_nama || ''}` : row.gudang_nama || '-'}</Typography></TableCell><TableCell align="right"><Typography fontWeight={700}>{formatCurrency(row.harga_beli)}</Typography><Typography variant="caption" color="text.secondary">/{row.satuan || '-'}</Typography></TableCell><TableCell align="right"><Typography fontWeight={600}>{formatCurrency(row.harga_pakai)}</Typography><Typography variant="caption" color="text.secondary">/{row.stn_pakai || '-'}</Typography></TableCell><TableCell><Chip size="small" label={row.aktif === 'Y' ? 'Aktif' : 'Tidak Aktif'} color={row.aktif === 'Y' ? 'success' : 'default'} variant={row.aktif === 'Y' ? 'filled' : 'outlined'} /></TableCell><TableCell align="center">{canUpdate ? <IconButton component={Link} href={`/harga-beli/${row.id}/edit`} color="primary"><Edit2 size={18} /></IconButton> : '-'}</TableCell></TableRow>) : <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">Belum ada data harga beli.</Typography></TableCell></TableRow>}</TableBody></Table></Box>
      <Paginate page={page} total={total} lastPage={lastPage} perPage={perPage} onPageChange={(value) => setFilters((current) => ({ ...current, page: value }))} />
    </Stack>}
  </MainCard></Fragment>;
}
