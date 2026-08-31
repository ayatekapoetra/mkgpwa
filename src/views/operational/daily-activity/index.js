'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, IconButton, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { GridOn, PictureAsPdf } from '@mui/icons-material';
import { Add, Eye, FilterSearch } from 'iconsax-react';

import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { downloadDailyActivities, useDailyActivities, useDailyActivityAccess } from 'api/daily-activity';
import { STATUSES, getHeaderId } from './utils';

const initialFilters = { page: 1, perPage: 25, date_from: '', date_to: '', shift_id: '', status: '', ctgunit: '', kontraktor: '', lokasi_site_id: '', lokasi_pit_id: '' };

const statusInfo = (value) => STATUSES.find((item) => item.id === String(value || '').toLowerCase()) || { label: value || '-', color: 'default' };
const shiftLabel = (value) => Number(value) === 1 ? 'Siang' : Number(value) === 2 ? 'Malam' : '-';

export default function DailyActivityList() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const { permissions, accessLoading, accessError } = useDailyActivityAccess();
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');
  const { data, dataLoading, dataError } = useDailyActivities(filters, permissions.read);
  const rows = useMemo(() => data.data || [], [data.data]);

  const options = useMemo(() => ({
    contractors: [...new Set(rows.map((row) => row.kontraktor).filter(Boolean))],
    sites: [...new Map(rows.filter((row) => row.lokasi_site_id).map((row) => [String(row.lokasi_site_id), row.lokasi_site_nama || row.lokasi_site_id])).entries()],
    pits: [...new Map(rows.filter((row) => row.lokasi_pit_id).map((row) => [String(row.lokasi_pit_id), row.lokasi_pit_nama || row.lokasi_pit_id])).entries()]
  }), [rows]);
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));
  const saveDownload = ({ blob, filename }) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };
  const getExportFilters = () => {
    const { page, perPage, ...activeFilters } = filters;
    return activeFilters;
  };
  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting('excel');
    setExportError('');
    try {
      saveDownload(await downloadDailyActivities(getExportFilters(), 'excel'));
    } catch (error) {
      setExportError(error?.message || 'Gagal membuat file Excel.');
    } finally {
      setExporting('');
    }
  };
  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting('pdf');
    setExportError('');
    try {
      saveDownload(await downloadDailyActivities(getExportFilters(), 'pdf'));
    } catch (error) {
      setExportError(error?.message || 'Gagal membuat file PDF.');
    } finally {
      setExporting('');
    }
  };

  if (accessLoading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;
  if (accessError || dataError) return <Alert severity="error">Gagal memuat daily activity. Fitur ini memerlukan koneksi internet.</Alert>;
  if (!permissions.read) return <Alert severity="warning">Anda tidak memiliki akses membaca Daily Activity.</Alert>;

  return (
    <>
      <Breadcrumbs custom heading="Daily Activity" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Daily Activity', to: '/daily-activity' }]} />
      <MainCard
        title={permissions.insert ? <Button component={Link} href="/daily-activity/create" variant="contained" startIcon={<Add />}>Tambah Activity</Button> : 'Daftar Activity'}
        secondary={<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" startIcon={exporting === 'excel' ? <CircularProgress size={16} /> : <GridOn />} onClick={handleExportExcel} disabled={Boolean(exporting) || dataLoading}>Excel</Button>
          <Button size="small" variant="contained" color="error" startIcon={exporting === 'pdf' ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />} onClick={handleExportPdf} disabled={Boolean(exporting) || dataLoading}>PDF</Button>
          <Button size="small" variant="outlined" startIcon={<FilterSearch />} onClick={() => setShowFilters((value) => !value)}>Filter</Button>
        </Stack>}
        content={false}
      >
        {exportError && <Alert severity="error" onClose={() => setExportError('')} sx={{ m: 2.5, mb: 0 }}>{exportError}</Alert>}
        {showFilters && (
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6} md={2}><TextField fullWidth type="date" label="Dari" value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6} md={2}><TextField fullWidth type="date" label="Sampai" value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6} md={2}><TextField select fullWidth label="Shift" value={filters.shift_id} onChange={(e) => setFilter('shift_id', e.target.value)}><MenuItem value="">Semua</MenuItem><MenuItem value="1">Siang</MenuItem><MenuItem value="2">Malam</MenuItem></TextField></Grid>
              <Grid item xs={6} md={2}><TextField select fullWidth label="Status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><MenuItem value="">Semua</MenuItem>{STATUSES.map((item) => <MenuItem value={item.id} key={item.id}>{item.label}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} md={2}><TextField select fullWidth label="Kategori Unit" value={filters.ctgunit} onChange={(e) => setFilter('ctgunit', e.target.value)}><MenuItem value="">Semua</MenuItem>{['HE', 'DT', 'Drill'].map((item) => <MenuItem value={item} key={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} md={2}><TextField select fullWidth label="Kontraktor" value={filters.kontraktor} onChange={(e) => setFilter('kontraktor', e.target.value)}><MenuItem value="">Semua</MenuItem>{options.contractors.map((item) => <MenuItem value={item} key={item}>{item}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} md={3}><TextField select fullWidth label="Site" value={filters.lokasi_site_id} onChange={(e) => setFilter('lokasi_site_id', e.target.value)}><MenuItem value="">Semua</MenuItem>{options.sites.map(([id, label]) => <MenuItem value={id} key={id}>{label}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} md={3}><TextField select fullWidth label="Pit" value={filters.lokasi_pit_id} onChange={(e) => setFilter('lokasi_pit_id', e.target.value)}><MenuItem value="">Semua</MenuItem>{options.pits.map(([id, label]) => <MenuItem value={id} key={id}>{label}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} md={2}><Button fullWidth sx={{ height: '100%' }} color="secondary" onClick={() => setFilters(initialFilters)}>Reset Filter</Button></Grid>
            </Grid>
          </Box>
        )}
        {dataLoading && <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}
        {!dataLoading && !rows.length && <Alert severity="info" sx={{ m: 2.5 }}>Belum ada data daily activity.</Alert>}
        {!dataLoading && mobile && <Stack spacing={1.5} sx={{ p: 2 }}>{rows.map((row, index) => {
          const status = statusInfo(row.status);
          return <Paper variant="outlined" sx={{ p: 2 }} key={row.group_key || `${getHeaderId(row)}-${row.status}-${index}`}><Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={700}>{moment(row.date_ops).format('DD MMM YYYY')} - Shift {shiftLabel(row.shift_id)}</Typography><Typography variant="body2" color="text.secondary">{row.lokasi_site_nama || '-'} / {row.lokasi_pit_nama || '-'}</Typography></Box><Chip size="small" label={status.label} color={status.color} /></Stack><DividerLine /><Typography variant="body2">{(row.kegiatan_names || []).join(', ') || row.kegiatan_name || '-'}</Typography><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}><Typography variant="caption">{row.equipment_ids?.length || row.item_count || 0} unit | {row.ctgunit || '-'}</Typography><Button component={Link} href={`/daily-activity/${getHeaderId(row)}`} size="small">Detail</Button></Stack></Paper>;
        })}</Stack>}
        {!dataLoading && !mobile && rows.length > 0 && <TableContainer><Table><TableHead><TableRow><TableCell>Tanggal / Shift</TableCell><TableCell>Status</TableCell><TableCell>Site / Pit</TableCell><TableCell>Aktivitas</TableCell><TableCell>Unit</TableCell><TableCell>Kontraktor</TableCell><TableCell align="center">Aksi</TableCell></TableRow></TableHead><TableBody>{rows.map((row, index) => { const status = statusInfo(row.status); return <TableRow hover key={row.group_key || `${getHeaderId(row)}-${row.status}-${index}`}><TableCell><Typography variant="subtitle2">{moment(row.date_ops).format('DD MMM YYYY')}</Typography><Typography variant="caption">Shift {shiftLabel(row.shift_id)}</Typography></TableCell><TableCell><Chip size="small" label={status.label} color={status.color} /></TableCell><TableCell>{row.lokasi_site_nama || '-'}<Typography variant="caption" display="block" color="text.secondary">{row.lokasi_pit_nama || '-'}</Typography></TableCell><TableCell>{(row.kegiatan_names || []).join(', ') || row.kegiatan_name || '-'}</TableCell><TableCell>{row.equipment_ids?.length || row.item_count || 0} {row.ctgunit || ''}</TableCell><TableCell>{row.kontraktor || '-'}</TableCell><TableCell align="center"><Tooltip title="Detail header"><IconButton component={Link} href={`/daily-activity/${getHeaderId(row)}`}><Eye size={20} /></IconButton></Tooltip></TableCell></TableRow>; })}</TableBody></Table></TableContainer>}
        <TablePagination component="div" count={data.total || 0} page={Math.max(0, (data.page || 1) - 1)} rowsPerPage={data.perPage || 25} rowsPerPageOptions={[10, 25, 50]} onPageChange={(_, page) => setFilter('page', page + 1)} onRowsPerPageChange={(e) => setFilters((current) => ({ ...current, perPage: Number(e.target.value), page: 1 }))} />
      </MainCard>
    </>
  );
}

function DividerLine() {
  return <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 1.5 }} />;
}
