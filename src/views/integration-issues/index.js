'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { ArrowRight2, Danger, Filter, Link2, Refresh, SearchNormal1, Timer1 } from 'iconsax-react';

import { useIntegrationIssues } from 'api/integration-issues';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';
import { formatDateTime, getErrorMessage, STATUS_PRESENTATION } from './presentation';

const STATUS_OPTIONS = ['FAILED', 'BLOCKED_MAPPING', 'DEAD_LETTER'];
const EVENT_OPTIONS = [
  { value: 'PURCHASE_INVOICE_READY', label: 'Faktur Pembelian' },
  { value: 'AP_PAYMENT_POSTED', label: 'Pembayaran Hutang' }
];
const COMPANY_OPTIONS = ['MTK-RNT', 'MTK-MNG', 'MTK-EKS'];

const breadcrumbLinks = [
  { title: 'Home', to: APP_DEFAULT_PATH },
  { title: 'Other' },
  { title: 'Integration Issues' }
];

function StatusChip({ status }) {
  const item = STATUS_PRESENTATION[status] || { label: status, color: 'default' };
  return <Chip size="small" color={item.color} label={item.label} sx={{ fontWeight: 700 }} />;
}

function SummaryCard({ label, value, icon, tone = 'primary', active, onClick }) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? `${tone}.main` : 'divider',
        bgcolor: active ? `${tone}.lighter` : 'background.paper',
        transition: 'transform 160ms ease, border-color 160ms ease',
        '&:hover': onClick ? { transform: 'translateY(-2px)', borderColor: `${tone}.main` } : undefined
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="body2">{label}</Typography>
            <Typography variant="h2" sx={{ mt: 0.5 }}>{value}</Typography>
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: `${tone}.lighter`, color: `${tone}.main` }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function IssueMobileCard({ row }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">#{row.id} · {row.event?.label}</Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>{row.document?.number || row.document?.id || '-'}</Typography>
            </Box>
            <StatusChip status={row.status} />
          </Stack>
          <Box>
            <Typography fontWeight={700}>{row.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{row.summary}</Typography>
          </Box>
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            {row.organization?.company_code && <Chip size="small" variant="outlined" label={row.organization.company_code} />}
            {row.missing_mapping_count > 0 && <Chip size="small" variant="outlined" icon={<Link2 size={15} />} label={`${row.missing_mapping_count} mapping`} />}
            <Chip size="small" variant="outlined" label={`${row.attempts?.count || 0}/${row.attempts?.max || 0} percobaan`} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">{formatDateTime(row.updated_at)}</Typography>
            <Button component={Link} href={`/integration-issues/${row.id}`} endIcon={<ArrowRight2 size={16} />}>Detail</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function IntegrationIssuesScreen() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const initial = { status: '', event_type: '', company_code: '', search: '', page: 1, per_page: 25 };
  const [filters, setFilters] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const { issues, summary, pagination, issuesLoading, issuesRefreshing, issuesError, refreshIssues } = useIntegrationIssues(filters);

  const applyFilters = () => setFilters({ ...draft, page: 1 });
  const selectStatus = (status) => {
    const next = filters.status === status ? '' : status;
    setDraft((current) => ({ ...current, status: next, page: 1 }));
    setFilters((current) => ({ ...current, status: next, page: 1 }));
  };

  return (
    <Fragment>
      <Breadcrumbs custom heading="Integration Issues" links={breadcrumbLinks} />
      <Box
        sx={{
          mt: 1,
          mb: 3,
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 4 },
          borderRadius: 3,
          color: 'common.white',
          background: 'linear-gradient(125deg, #172554 0%, #1e3a8a 52%, #0f766e 130%)',
          position: 'relative',
          overflow: 'hidden',
          '&:after': { content: '""', position: 'absolute', width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.07)', top: -150, right: -40 }
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.75, letterSpacing: 1.4 }}>OPS · Accounting observability</Typography>
        <Typography variant="h2" color="inherit" sx={{ mt: 0.5, maxWidth: 700 }}>Temukan hambatan sebelum menjadi selisih pembukuan</Typography>
        <Typography sx={{ mt: 1, opacity: 0.82, maxWidth: 720 }}>Setiap issue dilengkapi penyebab, dampak, dan langkah aman untuk mengirim data kembali ke Accounting.</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} lg={3}><SummaryCard label="Total issue" value={summary.total} icon={<Danger size={24} />} active={!filters.status} onClick={() => selectStatus('')} /></Grid>
        <Grid item xs={6} lg={3}><SummaryCard label="Retry otomatis" value={summary.failed} icon={<Timer1 size={24} />} tone="warning" active={filters.status === 'FAILED'} onClick={() => selectStatus('FAILED')} /></Grid>
        <Grid item xs={6} lg={3}><SummaryCard label="Perlu mapping" value={summary.blocked_mapping} icon={<Link2 size={24} />} tone="warning" active={filters.status === 'BLOCKED_MAPPING'} onClick={() => selectStatus('BLOCKED_MAPPING')} /></Grid>
        <Grid item xs={6} lg={3}><SummaryCard label="Dihentikan" value={summary.dead_letter} icon={<Danger size={24} />} tone="error" active={filters.status === 'DEAD_LETTER'} onClick={() => selectStatus('DEAD_LETTER')} /></Grid>
      </Grid>

      <MainCard content={false}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }}>
            <TextField
              size="small"
              placeholder="Cari nomor dokumen, PO, event, atau ID..."
              value={draft.search}
              onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))}
              onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }}
              InputProps={{ startAdornment: <SearchNormal1 size={18} style={{ marginRight: 8 }} /> }}
              sx={{ minWidth: { lg: 330 }, flex: 1 }}
            />
            <TextField select size="small" label="Status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} sx={{ minWidth: 180 }}>
              <MenuItem value="">Semua status</MenuItem>
              {STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}>{STATUS_PRESENTATION[status].label}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Transaksi" value={draft.event_type} onChange={(event) => setDraft((current) => ({ ...current, event_type: event.target.value }))} sx={{ minWidth: 190 }}>
              <MenuItem value="">Semua transaksi</MenuItem>
              {EVENT_OPTIONS.map((event) => <MenuItem key={event.value} value={event.value}>{event.label}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Company" value={draft.company_code} onChange={(event) => setDraft((current) => ({ ...current, company_code: event.target.value }))} sx={{ minWidth: 150 }}>
              <MenuItem value="">Semua company</MenuItem>
              {COMPANY_OPTIONS.map((company) => <MenuItem key={company} value={company}>{company}</MenuItem>)}
            </TextField>
            <Button variant="contained" startIcon={<Filter size={18} />} onClick={applyFilters}>filter</Button>
            <IconButton color="secondary" disabled={issuesRefreshing} onClick={() => refreshIssues()} aria-label="Refresh integration issues"><Refresh size={20} /></IconButton>
          </Stack>
        </Box>

        {issuesError && <Alert severity="error" sx={{ m: 2 }}>{getErrorMessage(issuesError)}</Alert>}
        {issuesLoading ? (
          <Stack spacing={1.5} sx={{ p: 2.5 }}>{[1, 2, 3].map((row) => <Skeleton key={row} variant="rounded" height={mobile ? 190 : 58} />)}</Stack>
        ) : issues.length === 0 ? (
          <Box sx={{ px: 3, py: 8, textAlign: 'center' }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}><Link2 size={30} /></Box>
            <Typography variant="h4">Tidak ada kegagalan integrasi</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Seluruh data pada filter ini dalam kondisi sehat atau sudah terkirim.</Typography>
            <Button sx={{ mt: 2 }} onClick={() => refreshIssues()} startIcon={<Refresh size={18} />}>Periksa kembali</Button>
          </Box>
        ) : mobile ? (
          <Stack spacing={1.5} sx={{ p: 2 }}>{issues.map((row) => <IssueMobileCard key={row.id} row={row} />)}</Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 1050 }}>
              <TableHead><TableRow sx={{ bgcolor: 'action.hover' }}><TableCell>Dokumen</TableCell><TableCell>Company</TableCell><TableCell>Status</TableCell><TableCell>Penjelasan</TableCell><TableCell>Dependency</TableCell><TableCell>Percobaan</TableCell><TableCell>Diperbarui</TableCell><TableCell align="right">Aksi</TableCell></TableRow></TableHead>
              <TableBody>
                {issues.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell><Typography fontWeight={700}>{row.document?.number || row.document?.id || '-'}</Typography><Typography variant="caption" color="text.secondary">#{row.id} · {row.event?.label}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{row.organization?.company_code || '-'}</Typography><Typography variant="caption" color="text.secondary">{row.organization?.branch_name || row.organization?.branch_code || '-'}</Typography></TableCell>
                    <TableCell><StatusChip status={row.status} /></TableCell>
                    <TableCell sx={{ maxWidth: 330 }}><Typography variant="body2" fontWeight={700}>{row.title}</Typography><Typography variant="caption" color="text.secondary">{row.summary}</Typography></TableCell>
                    <TableCell>{row.missing_mapping_count ? <Chip size="small" variant="outlined" icon={<Link2 size={15} />} label={`${row.missing_mapping_count} mapping`} /> : '-'}</TableCell>
                    <TableCell>{row.attempts?.count || 0} / {row.attempts?.max || 0}</TableCell>
                    <TableCell><Typography variant="body2">{formatDateTime(row.updated_at)}</Typography></TableCell>
                    <TableCell align="right"><Button component={Link} href={`/integration-issues/${row.id}`} variant="outlined" size="small" endIcon={<ArrowRight2 size={15} />}>Detail</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {!issuesLoading && pagination.total > 0 && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={Math.max(0, pagination.page - 1)}
            rowsPerPage={pagination.per_page}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, page) => setFilters((current) => ({ ...current, page: page + 1 }))}
            onRowsPerPageChange={(event) => {
              const perPage = Number(event.target.value);
              setDraft((current) => ({ ...current, per_page: perPage, page: 1 }));
              setFilters((current) => ({ ...current, per_page: perPage, page: 1 }));
            }}
          />
        )}
      </MainCard>
    </Fragment>
  );
}
