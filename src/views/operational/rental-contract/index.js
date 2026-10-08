'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Add, Eye, Filter, DocumentText, Buildings, ShieldTick, CalendarTick, MessageQuestion } from 'iconsax-react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { statusColor, statusLabel, useRentalContracts, useRentalContractAccess, useRentalContractStats } from 'api/rental-contract';
import FilterRentalContract from './filter';

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};

const initialFilters = {
  search: '',
  contract_number: '',
  penyewa_id: '',
  status: '',
  notes: '',
  role: '',
  billing_unit: '',
  equipment_ids: [],
  page: 1,
  per_page: 25
};

function SummaryCard({ label, value, helper, icon: Icon, color = 'primary' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, borderTop: 3, borderTopColor: `${color}.main` }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box minWidth={0}>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>{label}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.25 }}>{value}</Typography>
            {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
          </Box>
          <Box sx={{ width: 38, height: 38, borderRadius: 1.5, display: 'grid', placeItems: 'center', color: `${color}.main`, bgcolor: `${color}.lighter`, flexShrink: 0 }}>
            <Icon size={20} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function RentalContractList() {
  const [filters, setFilters] = useState(initialFilters);
  const [openFilter, setOpenFilter] = useState(false);
  const result = useRentalContracts(filters);
  const { permissions } = useRentalContractAccess();
  const stats = useRentalContractStats();

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (['page', 'per_page', 'search'].includes(key)) return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== null && value !== undefined;
  }).length;

  return <>
    <Breadcrumbs custom heading="Kontrak Rental" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Operational' }, { title: 'Kontrak Rental' }]} />
    <MainCard
      title={!permissions.can_insert ? <Button component={Link} href="/rental-contracts/create" variant="contained" startIcon={<Add size={18} />}>Buat Kontrak</Button> : 'Kontrak Rental'}
      secondary={
        <Stack direction="row" spacing={1}>
          <Tooltip title="Bantuan">
            <IconButton
              color="secondary"
              component={Link}
              href="/bantuan/rental-contract.md"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <MessageQuestion size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton color="secondary" onClick={() => setOpenFilter(true)} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Filter size={20} />
              {activeFilterCount > 0 && <Chip size="small" color="primary" label={activeFilterCount} sx={{ position: 'absolute', top: -6, right: -6, height: 18, fontSize: '0.7rem', fontWeight: 800 }} />}
            </IconButton>
          </Tooltip>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard label="Kontrak Aktif" value={stats.loading ? '…' : stats.totalActive} icon={DocumentText} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard label="Equipment Main" value={stats.loading ? '…' : stats.totalMain} icon={Buildings} color="info" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard label="Equipment Backup" value={stats.loading ? '…' : stats.totalBackup} icon={ShieldTick} color="warning" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard label="Expired Terdekat" value={stats.nearestExpiry ? formatDate(stats.nearestExpiry) : '—'} icon={CalendarTick} color="error" helper="Tanggal kontrak berakhir" />
          </Grid>
        </Grid>

        {result.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : result.error ? (
          <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => result.mutate()}>Coba lagi</Button>}>Gagal memuat data kontrak.</Alert>
        ) : !result.rows?.length ? (
          <Alert severity="info">Belum ada kontrak rental yang sesuai filter.</Alert>
        ) : (
          <TableContainer component={Box} sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.lighter' }}>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Kode Kontrak</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Penyewa</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Periode</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: 'primary.main' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.rows.map((row, idx) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><Typography variant="caption" fontWeight={600}>{(result.page - 1) * result.perPage + idx + 1}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={800} color="primary.main">{row.contract_number || `#${row.id}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{row.penyewa_name || row.penyewa?.nama || row.penyewa_id || '-'}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{formatDate(row.start_date)} - {formatDate(row.end_date)}</Typography></TableCell>
                    <TableCell><Chip size="small" color={statusColor[row.status] || 'default'} label={statusLabel[row.status] || row.status} sx={{ fontWeight: 700, height: 22 }} /></TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detail">
                        <IconButton component={Link} href={`/rental-contracts/${row.id}`} color="primary" size="small"><Eye size={18} /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {result.total > result.perPage && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Hal {result.page} dari {result.lastPage} · {result.total} data
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" disabled={result.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: result.page - 1 }))}>Sebelumnya</Button>
              <Button size="small" variant="outlined" disabled={result.page >= result.lastPage} onClick={() => setFilters((prev) => ({ ...prev, page: result.page + 1 }))}>Berikutnya</Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </MainCard>

    <FilterRentalContract
      open={openFilter}
      onClose={() => setOpenFilter(false)}
      data={filters}
      setData={setFilters}
      count={result.total}
    />
  </>;
}